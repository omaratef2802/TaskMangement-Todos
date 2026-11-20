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
  updateAssignedTodoStatus,
  deleteTodo,
  clearTodo,
  updateTodo,
} = require("../controllers/todo");

const { auth, relasedTo } = require("../middlewares/auth");

router.get("/AllTodosUsers", auth, relasedTo("Admin"), getAllTodos);
router.get("/stats", auth, getTodoStats);
router.get("/assignedToMe", auth, getAssignedToMe);
router.get("/assignedByMe", auth, getAssignedByMe);
router.patch("/assign/:id", auth, assignTodo);
router.patch("/unassign/:id", auth, unassignTodo);
router.patch("/assigned/:id/status", auth, updateAssignedTodoStatus);
router.get("/AllTodos", auth, getTodos);
router.get("/AllTodoByTitle", auth, getTodoByTitle);
router.get("/AllTodoByStatus", auth, getTodoByStatus);
router.get("/todo/:id", auth, getTodoById);
router.post("/addTodo", auth, createTodo);
router.patch("/updateTodo/:id", auth, updateTodo);
router.delete("/deleteTodo/:id", auth, deleteTodo);
router.delete("/clearTodo", auth, clearTodo);

module.exports = router;
