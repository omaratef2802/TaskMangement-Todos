const express = require("express");
const passport = require("./config/passport");

const app = express();

app.use(express.json());
app.use(passport.initialize());

const users = require("./routers/users");
const todos = require("./routers/todos");

app.use("/api/user", users);
app.use("/api/todo", todos);

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = { app };
