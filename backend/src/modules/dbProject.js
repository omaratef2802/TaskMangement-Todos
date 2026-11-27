const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "organizations", required: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "workspaces", required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, default: "", maxlength: 2000 },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  startDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
}, { timestamps: true });

projectSchema.index({ workspaceId: 1, createdAt: -1 });
module.exports = mongoose.model("projects", projectSchema);
