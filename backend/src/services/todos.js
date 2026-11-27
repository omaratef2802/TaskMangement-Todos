const mongoose = require("mongoose");
const dbTodo = require("../modules/dbTodos");
const dbUser = require("../modules/dbUser");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const { logTodoActivity } = require("./todoActivity");
const { assertProjectAccess, assertWorkspaceAccess } = require("./organizations");

const getProjectVisibilityFilter = async () => ({ organizationId: null });

const ensureProjectMembership = async (todo, userId) => {
  const projectId = todo?.projectId?._id || todo?.projectId;
  const workspaceId = todo?.workspaceId?._id || todo?.workspaceId;
  if (projectId) await assertProjectAccess(projectId, userId);
  else if (workspaceId) await assertWorkspaceAccess(workspaceId, userId);
};

const editableFields = [
  "type",
  "title",
  "status",
  "description",
  "deadline",
  "category",
  "priority",
];

const allowedSortFields = [
  "createdAt",
  "updatedAt",
  "deadline",
  "title",
  "status",
  "priority",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getListOptions = (query = {}) => {
  const stringFields = ["sortBy", "order", "status", "priority", "type", "category", "search", "overdue", "reviewStatus", "includeAssigned", "projectId", "workspaceId"];
  for (const field of stringFields) {
    if (query[field] !== undefined && typeof query[field] !== "string") {
      throw new ApiError(400, `Invalid ${field} query parameter`);
    }
  }
  if (query.includeAssigned !== undefined && !["true", "false"].includes(query.includeAssigned)) {
    throw new ApiError(400, "includeAssigned must be true or false");
  }

  if (query.page !== undefined && typeof query.page !== "string") {
    throw new ApiError(400, "Invalid page query parameter");
  }
  if (query.limit !== undefined && typeof query.limit !== "string") {
    throw new ApiError(400, "Invalid limit query parameter");
  }

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "Page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100");
  }

  const sortBy = query.sortBy || "createdAt";
  if (!allowedSortFields.includes(sortBy)) {
    throw new ApiError(400, "Invalid sort field");
  }

  const order = query.order || "desc";
  if (!["asc", "desc"].includes(order)) {
    throw new ApiError(400, "Order must be asc or desc");
  }

  const filter = { deletedAt: null };

  if (query.status !== undefined) {
    if (!["not-started", "in-progress", "done"].includes(query.status)) {
      throw new ApiError(400, "Invalid todo status");
    }
    filter.status = query.status;
  }

  if (query.reviewStatus !== undefined) {
    if (!["not-submitted", "pending", "changes-requested", "approved"].includes(query.reviewStatus)) {
      throw new ApiError(400, "Invalid review status");
    }
    filter.reviewStatus = query.reviewStatus;
  }

  if (query.priority !== undefined) {
    if (!["low", "medium", "high"].includes(query.priority)) {
      throw new ApiError(400, "Invalid todo priority");
    }
    filter.priority = query.priority;
  }

  if (query.type !== undefined) {
    if (!["task", "todo"].includes(query.type)) {
      throw new ApiError(400, "Invalid todo type");
    }
    filter.type = query.type;
  }

  if (query.category !== undefined) {
    if (typeof query.category !== "string" || !query.category.trim()) {
      throw new ApiError(400, "Please provide a valid category");
    }
    filter.category = query.category.trim();
  }

  if (query.search !== undefined) {
    if (typeof query.search !== "string" || !query.search.trim()) {
      throw new ApiError(400, "Please provide a valid search value");
    }
    filter.title = { $regex: escapeRegex(query.search.trim()), $options: "i" };
  }

  if (query.overdue !== undefined) {
    if (!["true", "false"].includes(query.overdue)) {
      throw new ApiError(400, "Overdue must be true or false");
    }
    const now = new Date();
    if (query.overdue === "true") {
      filter.$and = [
        ...(filter.$and || []),
        { deadline: { $lt: now } },
        { status: { $ne: "done" } },
      ];
    } else {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { deadline: { $gte: now } },
            { deadline: null },
            { status: "done" },
          ],
        },
      ];
    }
  }

  return {
    filter,
    page,
    limit,
    skip: (page - 1) * limit,
    sort: { [sortBy]: order === "asc" ? 1 : -1 },
  };
};

const createTodos = async (todo = {}, userId) => {
  const todoData = {};

  for (const field of editableFields) {
    if (todo[field] !== undefined) todoData[field] = todo[field];
  }

  if (
    todoData.deadline !== undefined &&
    todoData.deadline !== null &&
    Number.isNaN(new Date(todoData.deadline).getTime())
  ) {
    throw new ApiError(400, "Invalid todo deadline");
  }

  if (todo.assignedUserIds !== undefined && !Array.isArray(todo.assignedUserIds)) {
    throw new ApiError(400, "assignedUserIds must be an array");
  }

  if (todo.projectId !== undefined && todo.workspaceId !== undefined) {
    throw new ApiError(400, "Choose either a workspace or a project for this task");
  }
  if (todo.projectId !== undefined) {
    const { project, org, workspace } = await assertProjectAccess(todo.projectId, userId);
    todoData.projectId = project._id;
    todoData.organizationId = org._id;
    todoData.workspaceId = workspace._id;
  } else if (todo.workspaceId !== undefined) {
    const { workspace, org } = await assertWorkspaceAccess(todo.workspaceId, userId);
    todoData.workspaceId = workspace._id;
    todoData.organizationId = org._id;
  }

  const assignedUserIds = [...new Set((todo.assignedUserIds || []).map((id) => String(id)))];
  if (assignedUserIds.length > 20) {
    throw new ApiError(400, "You can assign a todo to a maximum of 20 users");
  }
  if (assignedUserIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, "One or more assigned user IDs are invalid");
  }
  if (assignedUserIds.includes(String(userId))) {
    throw new ApiError(400, "You cannot assign a todo to yourself");
  }
  if (assignedUserIds.length) {
    const users = await dbUser.find({ _id: { $in: assignedUserIds } }).select("_id");
    if (users.length !== assignedUserIds.length) {
      throw new ApiError(404, "One or more users were not found");
    }
    if (todoData.organizationId) {
      const Organization = require("../modules/dbOrganization");
      const organization = await Organization.findOne({
        _id: todoData.organizationId,
        "members.userId": { $all: assignedUserIds },
      }).select("_id");
      if (!organization) throw new ApiError(403, "All assignees must belong to this organization");
    }
    todoData.assignedTo = assignedUserIds;
    todoData.assignedStatuses = assignedUserIds.map((assignedId) => ({
      userId: assignedId,
      status: "not-started",
      completedAt: null,
    }));
  }

  if (todoData.status === "done") {
    todoData.completedAt = new Date();
  }

  const created = await dbTodo.create({ ...todoData, userId });
  await logTodoActivity(created._id, userId, "created");
  return created;
};

const getTodoByTitleService = async (title, userId) => {
  if (typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Please provide a valid title");
  }

  return await dbTodo.find({
    userId,
    deletedAt: null,
    title: { $regex: escapeRegex(title.trim()), $options: "i" },
    $and: [await getProjectVisibilityFilter(userId)],
  }).populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
    .sort({ createdAt: -1 });
};

const getTodoByStatusService = async (status, userId) => {
  if (
    typeof status !== "string" ||
    !["not-started", "in-progress", "done"].includes(status)
  ) {
    throw new ApiError(400, "Invalid todo status");
  }

  return await dbTodo.find({ status, userId, deletedAt: null, $and: [await getProjectVisibilityFilter(userId)] })
    .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
    .sort({ createdAt: -1 });
};

const getTodoByIdService = async (id, userId, isAdmin = false) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const todo = await dbTodo.findOne({ _id: id, deletedAt: null })
    .populate("userId", "fname lname username mail image")
    .populate("assignedTo", "fname lname username image")
    .populate("assignedStatuses.userId", "fname lname username image")
    .populate("projectId", "name status workspaceId")
    .populate("workspaceId", "name key organizationId");
  if (!todo) throw new ApiError(404, "Todo not found");

  const isParticipant = String(todo.userId?._id || todo.userId) === String(userId)
    || (todo.assignedTo || []).some((item) => String(item?._id || item) === String(userId));
  if (!isAdmin) {
    if (todo.projectId?._id || todo.workspaceId) await ensureProjectMembership(todo, userId);
    else if (!isParticipant) throw new ApiError(404, "Todo not found");
  }

  return todo;
};

const getTodosService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter };
  if (query.projectId !== undefined && query.workspaceId !== undefined) {
    throw new ApiError(400, "Choose either a workspace or a project filter");
  }
  if (query.projectId !== undefined) {
    const { project } = await assertProjectAccess(query.projectId, userId);
    filter.projectId = project._id;
  }
  if (query.workspaceId !== undefined) {
    const { workspace } = await assertWorkspaceAccess(query.workspaceId, userId);
    filter.workspaceId = workspace._id;
  }
  if ((query.projectId || query.workspaceId) && query.includeAssigned === "true") {
    throw new ApiError(400, "includeAssigned cannot be combined with projectId");
  }
  if (query.projectId || query.workspaceId) {
    // Organization members can see every task in the selected workspace or project.
  } else if (query.includeAssigned === "true") {
    const status = filter.status;
    delete filter.status;
    delete filter.$and;
    filter.$or = [{ userId }, { assignedTo: userId }];
    const conditions = [];
    if (status) {
      conditions.push({
        $or: [
          { userId, status },
          { assignedTo: userId, assignedStatuses: { $elemMatch: { userId, status } } },
        ],
      });
    }
    if (query.overdue === "true") {
      conditions.push({
        deadline: { $lt: new Date() },
        $or: [
          { userId, status: { $ne: "done" } },
          { assignedTo: userId, assignedStatuses: { $elemMatch: { userId, status: { $ne: "done" } } } },
        ],
      });
    } else if (query.overdue === "false") {
      conditions.push({
        $or: [
          { deadline: { $gte: new Date() } },
          { deadline: null },
          { userId, status: "done" },
          { assignedTo: userId, assignedStatuses: { $elemMatch: { userId, status: "done" } } },
        ],
      });
    }
    if (conditions.length) filter.$and = conditions;
  } else {
    filter.userId = userId;
  }

  if (!query.projectId && !query.workspaceId) {
    filter.$and = [...(filter.$and || []), await getProjectVisibilityFilter(userId)];
  }

  const [todos, total] = await Promise.all([
    dbTodo.find(filter)
      .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit),
    dbTodo.countDocuments(filter),
  ]);

  return {
    todos,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
};

const getAllTodosService = async (query = {}) => {
  const options = getListOptions(query);

  const [todos, total] = await Promise.all([
    dbTodo.find(options.filter)
      .populate("userId", "fname lname mail username image")
      .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit),
    dbTodo.countDocuments(options.filter),
  ]);

  return {
    todos,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
};

const getTodoCategoriesService = async (userId) => {
  return await dbTodo.aggregate([
    {
      $match: {
        deletedAt: null,
        organizationId: null,
        $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { assignedTo: new mongoose.Types.ObjectId(userId) }],
      },
    },
    {
      $group: {
        _id: { $trim: { input: { $ifNull: ["$category", "general"] } } },
        count: { $sum: 1 },
      },
    },
    { $match: { _id: { $ne: "" } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ]);
};

const getTodoStatsService = async (userId) => {
  const objectUserId = new mongoose.Types.ObjectId(userId);
  const [workspace, assignedToMe, assignedByMe, unassigned] = await Promise.all([
    dbTodo.aggregate([
      {
        $match: {
          deletedAt: null,
          organizationId: null,
          $or: [{ userId: objectUserId }, { assignedTo: objectUserId }],
        },
      },
      {
        $addFields: {
          isOwner: { $eq: ["$userId", objectUserId] },
          myAssignment: {
            $first: {
              $filter: {
                input: { $ifNull: ["$assignedStatuses", []] },
                as: "entry",
                cond: { $eq: ["$$entry.userId", objectUserId] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          myStatus: {
            $cond: [
              "$isOwner",
              "$status",
              { $ifNull: ["$myAssignment.status", "not-started"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          notStarted: { $sum: { $cond: [{ $eq: ["$myStatus", "not-started"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$myStatus", "in-progress"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$myStatus", "done"] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$myStatus", "done"] }, { $ne: ["$deadline", null] }, { $lt: ["$deadline", new Date()] }] },
                1,
                0,
              ],
            },
          },
          low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        },
      },
    ]),
    dbTodo.countDocuments({ assignedTo: objectUserId, userId: { $ne: objectUserId }, organizationId: null, deletedAt: null }),
    dbTodo.countDocuments({ userId: objectUserId, assignedTo: { $exists: true, $ne: [] }, organizationId: null, deletedAt: null }),
    dbTodo.countDocuments({
      userId: objectUserId,
      organizationId: null,
      deletedAt: null,
      $or: [{ assignedTo: { $exists: false } }, { assignedTo: { $size: 0 } }],
    }),
  ]);

  const stats = workspace[0] || {
    total: 0, notStarted: 0, inProgress: 0, completed: 0, overdue: 0,
    low: 0, medium: 0, high: 0,
  };

  return {
    total: stats.total,
    notStarted: stats.notStarted,
    inProgress: stats.inProgress,
    completed: stats.completed,
    overdue: stats.overdue,
    priorities: { low: stats.low, medium: stats.medium, high: stats.high },
    assignments: { assignedToMe, assignedByMe, unassigned },
  };
};

const assignTodoService = async (id, ownerId, userIds) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "Please provide at least one user ID");
  }

  if (userIds.length > 20) {
    throw new ApiError(400, "You can assign a todo to a maximum of 20 users");
  }

  const normalizedIds = [...new Set(userIds.map((userId) => String(userId)))];
  if (normalizedIds.some((userId) => !mongoose.isValidObjectId(userId))) {
    throw new ApiError(400, "One or more user IDs are invalid");
  }

  if (normalizedIds.includes(String(ownerId))) {
    throw new ApiError(400, "You cannot assign a todo to yourself");
  }

  const todo = await dbTodo.findOne({ _id: id, userId: ownerId, deletedAt: null });
  if (!todo) throw new ApiError(404, "Todo not found");
  await ensureProjectMembership(todo, ownerId);
  if (todo.organizationId) {
    const Organization = require("../modules/dbOrganization");
    const organization = await Organization.findOne({
      _id: todo.organizationId,
      "members.userId": { $all: normalizedIds },
    }).select("_id");
    if (!organization) throw new ApiError(403, "All assignees must belong to this organization");
  }

  const users = await dbUser.find({ _id: { $in: normalizedIds } }).select("_id fname lname mail");
  if (users.length !== normalizedIds.length) {
    throw new ApiError(404, "One or more users were not found");
  }

  const objectIds = normalizedIds.map(
    (userId) => new mongoose.Types.ObjectId(userId),
  );
  const newIds = normalizedIds.filter(
    (userId) => !todo.assignedTo.some((assignedId) => String(assignedId) === userId),
  );
  if (todo.assignedTo.length + newIds.length > 20) {
    throw new ApiError(400, "A todo can have a maximum of 20 assignees");
  }

  const updatedTodo = await dbTodo.findOneAndUpdate(
    {
      _id: id,
      userId: ownerId,
      deletedAt: null,
      $expr: {
        $lte: [
          {
            $size: {
              $setUnion: [{ $ifNull: ["$assignedTo", []] }, objectIds],
            },
          },
          20,
        ],
      },
    },
    { $addToSet: { assignedTo: { $each: objectIds } } },
    { new: true, runValidators: true },
  ).populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image");

  if (!updatedTodo) {
    const stillOwned = await dbTodo.exists({ _id: id, userId: ownerId, deletedAt: null });
    if (!stillOwned) throw new ApiError(404, "Todo not found");
    throw new ApiError(400, "A todo can have a maximum of 20 assignees");
  }


  const statusIds = normalizedIds
    .filter((uid) => !todo.assignedStatuses.some((item) => String(item.userId) === uid))
    .map((uid) => ({ userId: new mongoose.Types.ObjectId(uid), status: "not-started", completedAt: null }));
  if (statusIds.length) {
    await dbTodo.updateOne({ _id: id, userId: ownerId, deletedAt: null }, { $addToSet: { assignedStatuses: { $each: statusIds } } });
  }
  const newlyAssignedUsers = users.filter((user) => newIds.includes(String(user._id)));
  const owner = await dbUser.findById(ownerId).select("fname lname");
  const appUrl = (process.env.CLIENT_URL || "http://localhost:4200").split(",")[0].trim();
  await Promise.allSettled(newlyAssignedUsers.map((user) => sendEmail(
    user.mail,
    "New task assigned: " + todo.title,
    "<h2>You have a new task</h2><p>Hello " + user.fname + ",</p><p>" + (owner ? owner.fname + " " + owner.lname : "A teammate") + " assigned you to <strong>" + todo.title + "</strong>.</p><p><a href=\"" + appUrl + "/app/tasks/" + id + "\">Open task</a></p>",
  ).catch((error) => console.error("Assignment email failed:", error.message))));
  await logTodoActivity(id, ownerId, "assigned", { userIds: newIds });
  return await dbTodo.findById(id)
    .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image");
};

const unassignTodoService = async (id, ownerId, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  if (typeof userId !== "string" || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const currentTodo = await dbTodo.findOne({ _id: id, userId: ownerId, assignedTo: userId, deletedAt: null });
  if (!currentTodo) throw new ApiError(404, "Todo not found or user is not assigned");
  await ensureProjectMembership(currentTodo, ownerId);

  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, userId: ownerId, assignedTo: userId, deletedAt: null },
    { $pull: { assignedTo: userId, assignedStatuses: { userId } } },
    { new: true, runValidators: true },
  ).populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image");

  if (!todo) {
    throw new ApiError(404, "Todo not found or user is not assigned");
  }
  await logTodoActivity(id, ownerId, "unassigned", { userId });
  return todo;
};

const getAssignedToMeService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter, assignedTo: userId, deletedAt: null };
  const status = filter.status;
  delete filter.status;
  delete filter.$and;
  const conditions = [];
  if (status) filter.assignedStatuses = { $elemMatch: { userId, status } };
  if (query.overdue === "true") {
    conditions.push({ deadline: { $lt: new Date() } });
    conditions.push({ assignedStatuses: { $elemMatch: { userId, status: { $ne: "done" } } } });
  } else if (query.overdue === "false") {
    conditions.push({
      $or: [
        { deadline: { $gte: new Date() } },
        { deadline: null },
        { assignedStatuses: { $elemMatch: { userId, status: "done" } } },
      ],
    });
  }
  if (conditions.length) filter.$and = conditions;
  filter.$and = [...(filter.$and || []), await getProjectVisibilityFilter(userId)];

  const [todos, total] = await Promise.all([
    dbTodo.find(filter)
      .populate("userId", "fname lname username image")
      .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit),
    dbTodo.countDocuments(filter),
  ]);

  return {
    todos,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
};

const getAssignedByMeService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter, userId, assignedTo: { $exists: true, $ne: [] }, deletedAt: null };
  filter.$and = [...(filter.$and || []), await getProjectVisibilityFilter(userId)];

  const [todos, total] = await Promise.all([
    dbTodo.find(filter)
      .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit),
    dbTodo.countDocuments(filter),
  ]);

  return {
    todos,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
};

const getAssignableUsersService = async (currentUserId, query = {}) => {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (
    (query.page !== undefined && typeof query.page !== "string") ||
    (query.limit !== undefined && typeof query.limit !== "string") ||
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    throw new ApiError(400, "Invalid pagination values");
  }

  const filter = { _id: { $ne: currentUserId } };
  if (query.search !== undefined) {
    if (
      typeof query.search !== "string" ||
      !query.search.trim() ||
      query.search.trim().length > 100
    ) {
      throw new ApiError(400, "Search must be between 1 and 100 characters");
    }

    const search = escapeRegex(query.search.trim());
    filter.$or = [
      { fname: { $regex: search, $options: "i" } },
      { lname: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    dbUser.find(filter)
      .select("fname lname username image")
      .sort({ fname: 1, lname: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    dbUser.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateAssignedTodoStatusService = async (id, assigneeId, status) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
  if (!["not-started", "in-progress", "done"].includes(status)) throw new ApiError(400, "Invalid todo status");

  const current = await dbTodo.findOne({ _id: id, assignedTo: assigneeId, deletedAt: null });
  if (!current) throw new ApiError(404, "Assigned todo not found");
  await ensureProjectMembership(current, assigneeId);
  if (["pending", "approved"].includes(current.reviewStatus)) {
    throw new ApiError(403, "Your progress is locked while the task is under review or approved");
  }

  const hasStatus = current.assignedStatuses.some((entry) => String(entry.userId) === String(assigneeId));
  if (!hasStatus) {
    await dbTodo.updateOne(
      { _id: id, assignedTo: assigneeId, deletedAt: null },
      { $push: { assignedStatuses: { userId: assigneeId, status: "not-started", completedAt: null } } },
    );
  }

  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, assignedTo: assigneeId, deletedAt: null, reviewStatus: { $nin: ["pending", "approved"] }, "assignedStatuses.userId": assigneeId },
    { $set: {
      "assignedStatuses.$.status": status,
      "assignedStatuses.$.completedAt": status === "done" ? new Date() : null,
    } },
    { new: true, runValidators: true },
  ).populate("assignedStatuses.userId", "fname lname username image");
  if (!todo) throw new ApiError(403, "Your progress is locked while the task is under review or approved");
  await logTodoActivity(id, assigneeId, "assignee_status_updated", { status });
  return todo;
};

const submitTodoForReviewService = async (id, assigneeId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
  const current = await dbTodo.findOne({ _id: id, assignedTo: assigneeId, deletedAt: null });
  if (!current) throw new ApiError(404, "Assigned todo not found");
  await ensureProjectMembership(current, assigneeId);
  const assignedStatus = current.assignedStatuses.find((entry) => String(entry.userId) === String(assigneeId));
  if (!assignedStatus || assignedStatus.status !== "done") throw new ApiError(400, "Complete your assigned task before submitting it for review");
  const allAssigneesCompleted = current.assignedTo.every((assignedId) =>
    current.assignedStatuses.some((entry) =>
      String(entry.userId) === String(assignedId) && entry.status === "done",
    ),
  );
  if (!allAssigneesCompleted) {
    throw new ApiError(400, "All assigned teammates must complete their work before the task can be submitted for review");
  }
  if (["pending", "approved"].includes(current.reviewStatus)) throw new ApiError(400, "This task is already submitted or approved");
  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, assignedTo: assigneeId, deletedAt: null },
    { $set: { reviewStatus: "pending", submittedAt: new Date(), reviewNote: "", reviewedAt: null, reviewedBy: null } },
    { new: true, runValidators: true },
  ).populate("userId", "fname lname username mail").populate("assignedTo", "fname lname username image");
  if (!todo) throw new ApiError(404, "Assigned todo not found");
  await logTodoActivity(id, assigneeId, "submitted_for_review");
  return todo;
};

const reviewTodoService = async (id, reviewerId, decision, note = "", isAdmin = false) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
  if (!["approved", "changes-requested"].includes(decision)) throw new ApiError(400, "Invalid review decision");
  if (typeof note !== "string" || note.length > 2000) throw new ApiError(400, "Review note must be 2000 characters or less");
  if (decision === "changes-requested" && !note.trim()) throw new ApiError(400, "Please provide a reason for the requested changes");

  const accessFilter = { _id: id, ...(isAdmin ? {} : { userId: reviewerId }), deletedAt: null };
  const current = await dbTodo.findOne(accessFilter).select("reviewStatus projectId");
  if (!current) throw new ApiError(404, "Task not found or you cannot review it");
  await ensureProjectMembership(current, reviewerId);
  if (decision === "approved" && current.reviewStatus !== "pending") {
    throw new ApiError(400, "Only a task waiting for review can be approved");
  }
  if (decision === "changes-requested" && !["pending", "approved"].includes(current.reviewStatus)) {
    throw new ApiError(400, "Task is not available for change requests");
  }

  const update = {
    reviewStatus: decision,
    reviewNote: note.trim(),
    reviewedAt: new Date(),
    reviewedBy: reviewerId,
  };
  if (decision === "changes-requested") {
    update.status = "in-progress";
    update.completedAt = null;
  }

  const todo = await dbTodo.findOneAndUpdate(
    { ...accessFilter, reviewStatus: current.reviewStatus },
    decision === "changes-requested"
      ? { $set: { ...update, "assignedStatuses.$[].status": "in-progress", "assignedStatuses.$[].completedAt": null } }
      : { $set: update },
    { new: true, runValidators: true },
  ).populate("userId", "fname lname username mail").populate("assignedTo", "fname lname username image")
    .populate("assignedStatuses.userId", "fname lname username image")
    .populate("reviewedBy", "fname lname username image");
  if (!todo) throw new ApiError(409, "Task review was updated by someone else. Refresh and try again");
  await logTodoActivity(id, reviewerId, decision === "approved" ? "review_approved" : "changes_requested", { note: note.trim() });
  return todo;
};

const deleteTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
  const current = await dbTodo.findOne({ _id: id, userId, deletedAt: null });
  if (!current) throw new ApiError(404, "Todo not found");
  await ensureProjectMembership(current, userId);
  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!todo) throw new ApiError(404, "Todo not found");
  await logTodoActivity(id, userId, "soft_deleted");
  return todo;
};

const clearTodosService = async (userId) => {
  const filter = { userId, deletedAt: null, $and: [await getProjectVisibilityFilter(userId)] };
  const todos = await dbTodo.find(filter).select("_id");
  const result = await dbTodo.updateMany(filter, { $set: { deletedAt: new Date() } });
  await Promise.all(todos.map((todo) => logTodoActivity(todo._id, userId, "soft_deleted")));
  return result;
};

const getDeletedTodosService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter, userId, deletedAt: { $ne: null }, $and: [await getProjectVisibilityFilter(userId)] };
  const [todos, total] = await Promise.all([
    dbTodo.find(filter).populate("assignedTo", "fname lname username image")
      .sort(options.sort).skip(options.skip).limit(options.limit),
    dbTodo.countDocuments(filter),
  ]);
  return { todos, pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) } };
};

const restoreTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
  const current = await dbTodo.findOne({ _id: id, userId, deletedAt: { $ne: null } });
  if (!current) throw new ApiError(404, "Deleted todo not found");
  await ensureProjectMembership(current, userId);
  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, userId, deletedAt: { $ne: null } },
    { $set: { deletedAt: null } },
    { new: true, runValidators: true },
  );
  if (!todo) throw new ApiError(404, "Deleted todo not found");
  await logTodoActivity(id, userId, "restored");
  return todo;
};

const permanentlyDeleteTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
  const todo = await dbTodo.findOne({ _id: id, userId, deletedAt: { $ne: null } });
  if (!todo) throw new ApiError(404, "Deleted todo not found");
  await ensureProjectMembership(todo, userId);

  const cloudinary = require("../config/cloudinary");
  await Promise.allSettled(
    (todo.attachments || []).map((file) =>
      cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType,
      }),
    ),
  );

  await dbTodo.deleteOne({ _id: id, userId, deletedAt: { $ne: null } });

  const activity = require("../modules/dbTodoActivity");
  const comments = require("../modules/dbTodoComment");
  const reminders = require("../modules/dbTodoReminder");
  await Promise.all([
    activity.deleteMany({ todoId: id }),
    comments.deleteMany({ todoId: id }),
    reminders.deleteMany({ todoId: id }),
  ]);
  return { message: "Todo permanently deleted" };
};

const updateTodoService = async (id, userId, data = {}, isAdmin = false) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const updateData = {};

  for (const field of editableFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  if (!Object.keys(updateData).length) {
    throw new ApiError(400, "No valid todo fields provided");
  }

  if (
    updateData.deadline !== undefined &&
    updateData.deadline !== null &&
    Number.isNaN(new Date(updateData.deadline).getTime())
  ) {
    throw new ApiError(400, "Invalid todo deadline");
  }

  const currentTodo = await dbTodo.findOne({ _id: id, ...(isAdmin ? {} : { userId }), deletedAt: null });
  if (!currentTodo) throw new ApiError(404, "Todo not found");
  await ensureProjectMembership(currentTodo, userId);

  if (updateData.status === "done") {
    updateData.completedAt = currentTodo.completedAt || new Date();
  } else if (updateData.status !== undefined) {
    updateData.completedAt = null;
  }

  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, ...(isAdmin ? {} : { userId }), deletedAt: null },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!todo) throw new ApiError(404, "Todo not found");
  if (updateData.deadline !== undefined) {
    await require("../modules/dbTodoReminder").deleteMany({ todoId: id });
  }
  await logTodoActivity(id, userId, isAdmin ? "admin_updated" : "updated", { fields: Object.keys(updateData) });
  return todo;
};

module.exports = {
  createTodos,
  getTodoByTitleService,
  getTodoByStatusService,
  getTodoByIdService,
  getTodosService,
  getAllTodosService,
  getTodoStatsService,
  getTodoCategoriesService,
  assignTodoService,
  unassignTodoService,
  getAssignedToMeService,
  getAssignedByMeService,
  getAssignableUsersService,
  updateAssignedTodoStatusService,
  submitTodoForReviewService,
  reviewTodoService,
  deleteTodoService,
  clearTodosService,
  getDeletedTodosService,
  restoreTodoService,
  permanentlyDeleteTodoService,
  updateTodoService,
};
