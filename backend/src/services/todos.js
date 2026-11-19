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

const createTodos = async (todo, userId) => {
  return await dbTodo.create({ ...todo, userId });
};

const getTodoByTitleService = async (title, userId) => {
  if (!title) throw new ApiError(400, "Please provide a title");
  const safeTitle = title.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
  return await dbTodo.find({
    userId,
    title: { $regex: safeTitle, $options: "i" },
  });
};

const getTodoByStatusService = async (status, userId) => {
  if (!status) throw new ApiError(400, "Please provide a status");
  return await dbTodo.find({ status, userId });
};

const getTodoByIdService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");

  const todo = await dbTodo.findOne({ _id: id, userId });
  if (!todo) throw new ApiError(404, "Todo not found");
  return todo;
};

const getTodosSercviec = async (userId) => {
  return await dbTodo.find({ userId }).populate("userId", "username");
};

const getAllTodosService = async () => {
  return await dbTodo.find().populate("userId", "mail username");
};

const deleteTodoService = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");

  const todo = await dbTodo.findOneAndDelete({ _id: id, userId });
  if (!todo) throw new ApiError(404, "Todo not found");
  return todo;
};

const clearTodosService = async (userId) => {
  return await dbTodo.deleteMany({ userId });
};

const updateTodoService = async (id, userId, data) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid todo ID");

  const updateData = {};
  for (const field of editableFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  if (!Object.keys(updateData).length) {
    throw new ApiError(400, "No valid todo fields provided");
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
  getTodosSercviec,
  getAllTodosService,
  deleteTodoService,
  clearTodosService,
  updateTodoService,
};
