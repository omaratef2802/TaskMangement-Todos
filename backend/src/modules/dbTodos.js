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
      required: [true, "Title is required"],
      minLength: 4,
      maxLength: 100,
      trim: true,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    deadline: {
      type: Date,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignTo: [
      {
        type: mongoose.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  { timestamps: true },
);

const todoModule = mongoose.model("todos", todoSchema);

module.exports = todoModule;
