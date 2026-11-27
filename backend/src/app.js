const express = require("express");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const ApiError = require("./utils/ApiError");

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:4200")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.use(passport.initialize());

const users = require("./routers/users");
const todos = require("./routers/todos");
const notifications = require("./routers/notifications");
const admin = require("./routers/admin");
const organizations = require("./routers/organizations");

app.use("/api/user", users);
app.use("/api/todo", todos);
app.use("/api/notifications", notifications);
app.use("/api/admin", admin);
app.use("/api/organizations", organizations);

app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use((err, req, res, next) => {
  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  res.status(statusCode).json({ message });
});

module.exports = { app };
