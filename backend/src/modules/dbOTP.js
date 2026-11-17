const mongoose = require("mongoose");

const otpShema = mongoose.Schema(
  {
    otp: {
      type: String,
      required: [true, "the otp is reuqied"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "the userid is reuqied"],
    },
    expireAt: {
      type: Date,
      required: [true, "the expiredAt is reuqied"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const otpModel = mongoose.model("otps", otpShema);

module.exports = otpModel;
