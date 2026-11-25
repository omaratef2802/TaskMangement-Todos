const mongoose = require("mongoose");
const dbTodo = require("../modules/dbTodos");
const dbUser = require("../modules/dbUser");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const { logTodoActivity } = require("./todoActivity");

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
  const stringFields = ["sortBy", "order", "status", "priority", "type", "category", "search", "overdue"];
  for (const field of stringFields) {
    if (query[field] !== undefined && typeof query[field] !== "string") {
      throw new ApiError(400, `Invalid ${field} query parameter`);
    }
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

  return await dbTodo.find({ status, userId, deletedAt: null })
    .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image")
    .sort({ createdAt: -1 });
};

const getTodoByIdService = async (id, userId, isAdmin = false) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const todo = await dbTodo.findOne({ _id: id, ...(isAdmin ? {} : { userId }), deletedAt: null })
    .populate("userId", "fname lname username mail image")
    .populate("assignedTo", "fname lname username image")
      .populate("assignedStatuses.userId", "fname lname username image");
  if (!todo) throw new ApiError(404, "Todo not found");

  return todo;
};

const getTodosService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter, userId };

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
      .populate("userId", "mail username")
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

const getTodoStatsService = async (userId) => {
  const [
    total,
    notStarted,
    inProgress,
    completed,
    overdue,
    low,
    medium,
    high,
    assignedToMe,
    assignedByMe,
    unassigned,
  ] = await Promise.all([
      dbTodo.countDocuments({ userId, deletedAt: null }),
      dbTodo.countDocuments({ userId, deletedAt: null, status: "not-started" }),
      dbTodo.countDocuments({ userId, deletedAt: null, status: "in-progress" }),
      dbTodo.countDocuments({ userId, deletedAt: null, status: "done" }),
      dbTodo.countDocuments({
        userId,
        deletedAt: null,
        status: { $ne: "done" },
        deadline: { $lt: new Date() },
      }),
      dbTodo.countDocuments({ userId, deletedAt: null, priority: "low" }),
      dbTodo.countDocuments({ userId, deletedAt: null, priority: "medium" }),
      dbTodo.countDocuments({ userId, deletedAt: null, priority: "high" }),
      dbTodo.countDocuments({ assignedTo: userId, userId: { $ne: userId }, deletedAt: null }),
      dbTodo.countDocuments({ userId, assignedTo: { $exists: true, $ne: [] }, deletedAt: null }),
      dbTodo.countDocuments({
        userId,
        deletedAt: null,
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: { $size: 0 } },
        ],
      }),
    ]);

  return {
    total,
    notStarted,
    inProgress,
    completed,
    overdue,
    priorities: { low, medium, high },
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
  const hasStatus = current.assignedStatuses.some((entry) => String(entry.userId) === String(assigneeId));
  if (!hasStatus) {
    await dbTodo.updateOne(
      { _id: id, assignedTo: assigneeId, deletedAt: null },
      { $push: { assignedStatuses: { userId: assigneeId, status: "not-started", completedAt: null } } },
    );
  }
  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, assignedTo: assigneeId, deletedAt: null, "assignedStatuses.userId": assigneeId },
    { $set: {
      "assignedStatuses.$.status": status,
      "assignedStatuses.$.completedAt": status === "done" ? new Date() : null,
    } },
    { new: true, runValidators: true },
  ).populate("assignedStatuses.userId", "fname lname username image");
  if (!todo) throw new ApiError(404, "Assigned todo not found");
  await logTodoActivity(id, assigneeId, "assignee_status_updated", { status });
  return todo;
};

const deleteTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
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
  const todos = await dbTodo.find({ userId, deletedAt: null }).select("_id");
  const result = await dbTodo.updateMany({ userId, deletedAt: null }, { $set: { deletedAt: new Date() } });
  await Promise.all(todos.map((todo) => logTodoActivity(todo._id, userId, "soft_deleted")));
  return result;
};

const getDeletedTodosService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter, userId, deletedAt: { $ne: null } };
  const [todos, total] = await Promise.all([
    dbTodo.find(filter).populate("assignedTo", "fname lname username image")
      .sort(options.sort).skip(options.skip).limit(options.limit),
    dbTodo.countDocuments(filter),
  ]);
  return { todos, pagination: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) } };
};

const restoreTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");
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
  assignTodoService,
  unassignTodoService,
  getAssignedToMeService,
  getAssignedByMeService,
  getAssignableUsersService,
  updateAssignedTodoStatusService,
  deleteTodoService,
  clearTodosService,
  getDeletedTodosService,
  restoreTodoService,
  permanentlyDeleteTodoService,
  updateTodoService,
};
