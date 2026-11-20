const mongoose = require("mongoose");
const dbTodo = require("../modules/dbTodos");
const ApiError = require("../utils/ApiError");

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

  const filter = {};

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
    if (query.overdue === "true") {
      filter.deadline = { $lt: new Date() };
      filter.status = { $ne: "done" };
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

  return await dbTodo.create({ ...todoData, userId });
};

const getTodoByTitleService = async (title, userId) => {
  if (typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Please provide a valid title");
  }

  return await dbTodo.find({
    userId,
    title: { $regex: escapeRegex(title.trim()), $options: "i" },
  }).sort({ createdAt: -1 });
};

const getTodoByStatusService = async (status, userId) => {
  if (
    typeof status !== "string" ||
    !["not-started", "in-progress", "done"].includes(status)
  ) {
    throw new ApiError(400, "Invalid todo status");
  }

  return await dbTodo.find({ status, userId }).sort({ createdAt: -1 });
};

const getTodoByIdService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const todo = await dbTodo.findOne({ _id: id, userId });
  if (!todo) throw new ApiError(404, "Todo not found");

  return todo;
};

const getTodosService = async (userId, query = {}) => {
  const options = getListOptions(query);
  const filter = { ...options.filter, userId };

  const [todos, total] = await Promise.all([
    dbTodo.find(filter)
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
  const [total, notStarted, inProgress, completed, overdue, low, medium, high] =
    await Promise.all([
      dbTodo.countDocuments({ userId }),
      dbTodo.countDocuments({ userId, status: "not-started" }),
      dbTodo.countDocuments({ userId, status: "in-progress" }),
      dbTodo.countDocuments({ userId, status: "done" }),
      dbTodo.countDocuments({
        userId,
        status: { $ne: "done" },
        deadline: { $lt: new Date() },
      }),
      dbTodo.countDocuments({ userId, priority: "low" }),
      dbTodo.countDocuments({ userId, priority: "medium" }),
      dbTodo.countDocuments({ userId, priority: "high" }),
    ]);

  return {
    total,
    notStarted,
    inProgress,
    completed,
    overdue,
    priorities: { low, medium, high },
  };
};

const deleteTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid todo ID");
  }

  const todo = await dbTodo.findOneAndDelete({ _id: id, userId });
  if (!todo) throw new ApiError(404, "Todo not found");

  return todo;
};

const clearTodosService = async (userId) => {
  return await dbTodo.deleteMany({ userId });
};

const updateTodoService = async (id, userId, data = {}) => {
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

  const currentTodo = await dbTodo.findOne({ _id: id, userId });
  if (!currentTodo) throw new ApiError(404, "Todo not found");

  if (updateData.status === "done") {
    updateData.completedAt = currentTodo.completedAt || new Date();
  } else if (updateData.status !== undefined) {
    updateData.completedAt = null;
  }

  const todo = await dbTodo.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!todo) throw new ApiError(404, "Todo not found");
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
  deleteTodoService,
  clearTodosService,
  updateTodoService,
};
