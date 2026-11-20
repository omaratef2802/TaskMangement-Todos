const mongoose = require("mongoose");
const schema = mongoose.Schema({
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: "todos", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  reminderType: { type: String, default: "24-hours", required: true },
  sentAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ todoId: 1, userId: 1, reminderType: 1 }, { unique: true });
module.exports = mongoose.model("todoReminders", schema);
