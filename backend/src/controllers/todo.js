const {
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
  updateTodoService,
} = require("../services/todos");

const createTodo = async (req, res, next) => {
  try {
    const todo = await createTodos(req.body, req.id);
    res.status(201).json({ message: "success", data: todo });
  } catch (err) {
    next(err);
  }
};

const getTodoByTitle = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoByTitleService(req.query.title, req.id),
    });
  } catch (err) {
    next(err);
  }
};

const getTodoByStatus = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoByStatusService(req.query.status, req.id),
    });
  } catch (err) {
    next(err);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoByIdService(req.params.id, req.id),
    });
  } catch (err) {
    next(err);
  }
};

const getTodos = async (req, res, next) => {
  try {
    const result = await getTodosService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getAllTodos = async (req, res, next) => {
  try {
    const result = await getAllTodosService(req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getTodoStats = async (req, res, next) => {
  try {
    res.status(200).json({
      message: "success",
      data: await getTodoStatsService(req.id),
    });
  } catch (err) {
    next(err);
  }
};

const assignTodo = async (req, res, next) => {
  try {
    const todo = await assignTodoService(
      req.params.id,
      req.id,
      req.body.userIds,
    );
    res.status(200).json({ message: "Users assigned successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

const unassignTodo = async (req, res, next) => {
  try {
    const todo = await unassignTodoService(
      req.params.id,
      req.id,
      req.body.userId,
    );
    res.status(200).json({ message: "User unassigned successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

const getAssignedToMe = async (req, res, next) => {
  try {
    const result = await getAssignedToMeService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getAssignedByMe = async (req, res, next) => {
  try {
    const result = await getAssignedByMeService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getAssignableUsers = async (req, res, next) => {
  try {
    const result = await getAssignableUsersService(req.id, req.query);
    res.status(200).json({
      message: "success",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const updateAssignedTodoStatus = async (req, res, next) => {
  try {
    const todo = await updateAssignedTodoStatusService(
      req.params.id,
      req.id,
      req.body.status,
    );
    res.status(200).json({ message: "Todo status updated successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    await deleteTodoService(req.params.id, req.id);
    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const clearTodo = async (req, res, next) => {
  try {
    const result = await clearTodosService(req.id);
    res.status(200).json({
      message: "Todos deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    next(err);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const todo = await updateTodoService(req.params.id, req.id, req.body);
    res.status(200).json({ message: "Todo updated successfully", data: todo });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTodo,
  getTodoByTitle,
  getTodoByStatus,
  getTodoById,
  getTodos,
  getAllTodos,
  getTodoStats,
  assignTodo,
  unassignTodo,
  getAssignedToMe,
  getAssignedByMe,
  getAssignableUsers,
  updateAssignedTodoStatus,
  deleteTodo,
  clearTodo,
  updateTodo,
};
