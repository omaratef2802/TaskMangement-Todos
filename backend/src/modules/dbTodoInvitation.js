const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: "todos", required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
  acceptedAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ todoId: 1, email: 1 }, { unique: true });
schema.index({ email: 1, status: 1 });

module.exports = mongoose.model("todoInvitations", schema);
