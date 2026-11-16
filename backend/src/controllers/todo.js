const ApiError = require("../utils/ApiError");
const {
  createTodos,
  getTodoByTitleService,
  getTodoByStatusService,
  getTodoByIdService,
  getTodosSercviec,
  getAllTodosService,
  deleteTodoService,
  clearTodosService,
} = require("../services/todos");

const createTodo = async (req, res, next) => {
  try {
    const todo = req.body;
    todo.userId = req.id;
    res.status(201).json({ message: "success", data: await createTodos(todo) });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const getTodoByTitle = async (req, res, next) => {
  try {
    const { title } = req.body;
    res.status(200).json({
      message: "success",
      data: await getTodoByTitleService(title, req.id),
    });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const getTodoByStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    res.status(200).json({
      message: "success",
      data: await getTodoByStatusService(status, req.id),
    });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    res
      .status(200)
      .json({ message: "success", data: await getTodoByIdService(id) });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const getTodos = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({ message: "success", data: await getTodosSercviec(req.id) });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const getAllTodos = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({ messag: "success", data: await getAllTodosService() });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteTodoService(id);
    res.status(203).json({ message: "success", data: "delted" });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const clearTodo = async (req, res, next) => {
  try {
    await clearTodosService(req.id);
    res.status(203).json({ message: "success", data: "deleted successfully" });
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};
const updateTodo = async (req, res, next) => {
  try {
  } catch (err) {
    next(new ApiError(404, err.message));
  }
};

module.exports = {
  createTodo,
  getTodoByTitle,
  getTodoByStatus,
  getTodoById,
  getTodos,
  getAllTodos,
  deleteTodo,
  clearTodo,
  updateTodo,
};
