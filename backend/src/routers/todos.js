const express = require("express");
const router = express.Router();

const {
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
  getDeletedTodos,
  restoreTodo,
  permanentlyDeleteTodo,
  getTodoActivity,
  getTodoComments,
  addTodoComment,
  updateTodoComment,
  deleteTodoComment,
} = require("../controllers/todo");

const { auth, relasedTo } = require("../middlewares/auth");

router.get("/AllTodosUsers", auth, relasedTo("Admin"), getAllTodos);
router.get("/stats", auth, getTodoStats);
router.get("/assignedToMe", auth, getAssignedToMe);
router.get("/assignedByMe", auth, getAssignedByMe);
router.get("/assignableUsers", auth, getAssignableUsers);
router.patch("/assign/:id", auth, assignTodo);
router.patch("/unassign/:id", auth, unassignTodo);
router.patch("/assigned/:id/status", auth, updateAssignedTodoStatus);
router.get("/AllTodos", auth, getTodos);
router.get("/trash", auth, getDeletedTodos);
router.patch("/restore/:id", auth, restoreTodo);
router.delete("/permanent/:id", auth, permanentlyDeleteTodo);
router.get("/activity/:id", auth, getTodoActivity);
router.get("/comments/:todoId", auth, getTodoComments);
router.post("/comments/:todoId", auth, addTodoComment);
router.patch("/comments/:todoId/:commentId", auth, updateTodoComment);
router.delete("/comments/:todoId/:commentId", auth, deleteTodoComment);
router.get("/AllTodoByTitle", auth, getTodoByTitle);
router.get("/AllTodoByStatus", auth, getTodoByStatus);
router.get("/todo/:id", auth, getTodoById);
router.post("/addTodo", auth, createTodo);
router.patch("/updateTodo/:id", auth, updateTodo);
router.delete("/deleteTodo/:id", auth, deleteTodo);
router.delete("/clearTodo", auth, clearTodo);

module.exports = router;
