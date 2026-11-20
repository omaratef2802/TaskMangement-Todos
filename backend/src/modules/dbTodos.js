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
      required: [true, "the user id is required"],
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
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    assignedStatuses: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
      status: { type: String, enum: ["not-started", "in-progress", "done"], default: "not-started" },
      completedAt: { type: Date, default: null },
    }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ assignedTo: 1, createdAt: -1 });
todoSchema.index({ deletedAt: 1, createdAt: -1 });
todoSchema.index({ "assignedStatuses.userId": 1, createdAt: -1 });

const todoModule = mongoose.model("todos", todoSchema);

module.exports = todoModule;
