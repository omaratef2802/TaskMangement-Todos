const mongoose = require("mongoose");
const todoSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "this titile is required"],
      unique: [true, "this todo must be unique"],
      minLength: 4,
      maxLength: 100,
    },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "done"],
      default: "not-started",
    },
    description: {
      type: String,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "users",
    },
    deadline: {
      type: Date,
    },
  },
  { timestapms: true },
);

const todoModule = mongoose.model("todos", todoSchema);

module.exports = todoModule;
