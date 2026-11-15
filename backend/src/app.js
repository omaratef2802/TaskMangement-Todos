const express = require("express");
const app = express();
app.use(express.json());

const users = require("./routers/users");
const todos = require("./routers/todos");

app.use("/api/user/", users);
app.use("/api/todo/", todos);

app.use("/api/user", users);
app.use("/api/todo", todos);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
});
module.exports = { app };
