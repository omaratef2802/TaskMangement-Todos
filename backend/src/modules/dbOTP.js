const mongoose = require("mongoose");

const otpShema = mongoose.Schema(
  {
    otp: {
      type: String,
      required: [true, "the otp is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "the user id is required"],
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expireAt: {
      type: Date,
      required: [true, "the expire date is required"],
      expires: 0,
    },
  },
  { timestamps: true },
);

const otpModel = mongoose.model("otps", otpShema);

module.exports = otpModel;
