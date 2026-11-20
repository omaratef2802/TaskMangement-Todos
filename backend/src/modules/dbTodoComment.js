const mongoose = require("mongoose");
const schema = mongoose.Schema({
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: "todos", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  text: { type: String, required: true, trim: true, minLength: 1, maxLength: 2000 },
}, { timestamps: true });
schema.index({ todoId: 1, createdAt: -1 });
module.exports = mongoose.model("todoComments", schema);
