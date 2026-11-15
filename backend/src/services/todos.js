const dbTodo = require("../modules/dbTodos");
const ApiError = require("../utils/ApiError");

const createTodos = async (todo) => {
  return await dbTodo.create(todo);
};
const getTodoByTitleService = async (title, userId) => {
  const todo = await dbTodo.find({ title, userId });
  if (!todo) throw new ApiError(404, "the todo isn't exit");
  return todo;
};
const getTodoByStatusService = async (status, userId) => {
  const todo = await dbTodo.find({ status, userId });
  if (!todo) throw new ApiError(404, "the todo isn't exist");
  return todo;
};

const getTodoByIdService = async (id) => {
  const todo = await dbTodo.findById(id);
  if (!todo) throw new ApiError(404, "the todo isn't exist");
  return todo;
};
const getTodosSercviec = async (userId) => {
  return await dbTodo.find({ userId }).populate("userId", "username");
};
const getAllTodosService = async () => {
  return await dbTodo.find().populate("userId", "mail username");
};
const deleteTodoService = async (id) => {
  return await dbTodo.findByIdAndDelete(id);
};

const clearTodosService = async (userId) => {
  return await dbTodo.deleteMany({ userId });
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
};
