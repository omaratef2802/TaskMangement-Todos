const mongoose = require("mongoose");
const todoSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["task", "todo"],
      default: "todo",
    },
    title: {
      type: String,
      required: [true, "this titile is required"],
      minLength: 4,
      maxLength: 100,
    },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "done"],
      default: "not-started",
    },
    description: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    deadline: {
      type: Date,
      default: new Date(),
    },
    completedAt: {
      type: Date,
      default: new Date(),
    },
    category: {
      type: String,
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "meduim",
    },
  },
  { timestamps: true },
);

const todoModule = mongoose.model("todos", todoSchema);

module.exports = todoModule;
