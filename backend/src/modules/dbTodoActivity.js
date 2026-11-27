const mongoose = require("mongoose");
const schema = mongoose.Schema({
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: "todos", required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  action: { type: String, required: true, trim: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
schema.index({ todoId: 1, createdAt: -1 });
module.exports = mongoose.model("todoActivities", schema);
