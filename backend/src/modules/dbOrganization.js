const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: "", maxlength: 500 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

organizationSchema.index({ "members.userId": 1 });
module.exports = mongoose.model("organizations", organizationSchema);
