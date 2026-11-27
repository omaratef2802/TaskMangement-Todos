const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  publicId: { type: String, required: true },
  url: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  format: { type: String, default: "" },
  mimeType: { type: String, required: true },
  resourceType: { type: String, enum: ["image", "raw", "video"], default: "raw" },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const todoSchema = mongoose.Schema(
  {
    type: { type: String, enum: ["task", "todo"], default: "todo" },
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
    description: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "the user id is required"],
    },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "organizations", default: null, index: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "workspaces", default: null, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "projects", default: null, index: true },
    deadline: { type: Date },
    completedAt: { type: Date, default: null },
    reviewStatus: { type: String, enum: ["not-submitted", "pending", "changes-requested", "approved"], default: "not-submitted" },
    reviewNote: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
    category: { type: String, default: "general", trim: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    assignedStatuses: {
      type: [new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
        status: { type: String, enum: ["not-started", "in-progress", "done"], default: "not-started" },
        completedAt: { type: Date, default: null },
      }, { _id: false })],
      default: [],
    },
    attachments: { type: [attachmentSchema], default: [] },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ assignedTo: 1, createdAt: -1 });
todoSchema.index({ deletedAt: 1, createdAt: -1 });
todoSchema.index({ "assignedStatuses.userId": 1, createdAt: -1 });
todoSchema.index({ projectId: 1, deletedAt: 1, createdAt: -1 });

const todoModule = mongoose.model("todos", todoSchema);

module.exports = todoModule;
