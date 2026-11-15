const express = require("express");
const router = express.Router();

const {
  createTodo,
  getTodoByTitle,
  getTodoByStatus,
  getTodoById,
  getTodos,
  getAllTodos,
  deleteTodo,
  clearTodo,
  updateTodo,
} = require("../controllers/todo");

const { auth, relasedTo } = require("../middlewares/auth");

router.get("/AllTodosUsers", auth, relasedTo("Admin"), getAllTodos);
router.get("/AllTodos", auth, getTodos);
router.get("/AllTodoByTitle", auth, getTodoByTitle);
router.get("/AllTodoByStatus", auth, getTodoByStatus);
router.get("/todo/:id", auth, getTodoById);
router.get("/AllTodoByTitle", getTodoByTitle);
router.post("/addTodo", auth, relasedTo("Admin"), createTodo);
router.delete("/deleteTodo/:id", auth, deleteTodo);
router.delete("/clearTodo", auth, relasedTo("Admin"), clearTodo);
router.patch("/updateTodo", auth, relasedTo("Admin"), updateTodo);

module.exports = router;
