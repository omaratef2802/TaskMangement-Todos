const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "organizations", required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, default: "", maxlength: 500 },
  key: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 8 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

workspaceSchema.index({ organizationId: 1, key: 1 }, { unique: true });
module.exports = mongoose.model("workspaces", workspaceSchema);
