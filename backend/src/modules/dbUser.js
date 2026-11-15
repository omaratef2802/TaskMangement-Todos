const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchmea = mongoose.Schema(
  {
    fname: {
      type: String,
      trim: true,
      required: [true, "first name is required"],
      minLength: 3,
      maxLength: 30,
    },
    lname: {
      type: String,
      trim: true,
      required: [true, "first name is required"],
      minLength: 3,
      maxLength: 30,
    },
    mail: {
      type: String,
      required: [true, "this mail is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (email) =>
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
        message: (obj) => `${obj.value} is not valid`,
      },
      unique: [true, "the email must be unique"],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["user", "Admin"],
      default: "user",
    },
  },
  { timestamps: true },
);

userSchmea.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

const userModule = mongoose.model("users", userSchmea);

module.exports = userModule;
