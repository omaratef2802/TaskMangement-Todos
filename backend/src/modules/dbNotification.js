const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: "todos", default: null },
  type: {
    type: String,
    enum: ["todo_created", "todo_updated", "todo_assigned", "todo_unassigned", "status_updated", "comment_added", "deadline_reminder", "todo_deleted", "todo_restored", "todo_submitted_for_review", "todo_review_approved", "todo_changes_requested", "todo_invitation_accepted"],
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("notifications", notificationSchema);
