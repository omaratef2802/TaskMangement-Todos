const crypto = require("crypto");
const dbUser = require("../modules/dbUser");
const bcrypt = require("bcrypt");
const genToken = require("../utils/gnToken");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const dbOtp = require("../modules/dbOTP");
const uploadImage = require("../utils/uploadImage");

const createUser = async (info) => {
  const user = await dbUser.create(info);
  try {
    await require("./todoInvitations").acceptPendingTodoInvitations(user);
  } catch (error) {
    console.error("Pending task invitations could not be linked:", error.message);
  }
  return user;
};

const Login = async (mail, password) => {
  const user = await dbUser.findOne({ mail: mail.trim().toLowerCase() });

  if (!user || !user.password)
    throw new ApiError(401, "Email or password is incorrect");

  const verify = await bcrypt.compare(password, user.password);
  if (!verify) throw new ApiError(401, "Email or password is incorrect");

  return genToken(process.env.SECRET, "1w", {
    userId: user._id,
    role: user.role,
  });
};

const googleLoginServices = async (user) => {
  if (!user) throw new ApiError(401, "Google authentication failed");
  try {
    await require("./todoInvitations").acceptPendingTodoInvitations(user);
  } catch (error) {
    console.error("Pending task invitations could not be linked:", error.message);
  }

  const token = genToken(process.env.SECRET, "1w", {
    userId: user._id,
    role: user.role,
  });

  return { token };
};

const getUserByID = async (id) => {
  return await dbUser.findById(id);
};

const getAllUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await dbUser.find().limit(limit).skip(skip);
};

const updataInfoToUser = async (id, data) => {
  const allowedFields = ["fname", "lname", "username"];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  if (!Object.keys(updateData).length) {
    throw new ApiError(400, "No valid profile fields provided");
  }

  const user = await dbUser.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "The user was not found");
  return user;
};

const updatePassw = async (confirmPassword, newPassword, password, id) => {
  const user = await dbUser.findById(id);
  if (!user) throw new ApiError(404, "The user was not found");

  if (confirmPassword !== newPassword) {
    throw new ApiError(400, "The confirmation password does not match");
  }

  if (user.password) {
    if (!password) throw new ApiError(400, "Please provide your current password");
    const verify = await bcrypt.compare(password, user.password);
    if (!verify) throw new ApiError(401, "The current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const updatedUser = await dbUser.findByIdAndUpdate(
    id,
    {
      $set: { password: hashedPassword },
      $unset: { resetTokenHash: 1 },
    },
    { new: true, runValidators: true },
  );

  if (!updatedUser) throw new ApiError(404, "The user was not found");
  return updatedUser;
};

const deleteuserFun = async (id) => {
  return await dbUser.findByIdAndDelete(id);
};

const forgetPassword = async (mail) => {
  const user = await dbUser.findOne({ mail: mail.trim().toLowerCase() });
  if (!user) throw new ApiError(404, "The user was not found");

  await dbOtp.deleteMany({ userId: user._id });
  await dbUser.updateOne({ _id: user._id }, { $unset: { resetTokenHash: 1 } });

  const otpGen = crypto.randomInt(100000, 1000000).toString();
  const otpDoc = await dbOtp.create({
    otp: otpGen,
    userId: user._id,
    expireAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  try {
    await sendEmail(
      user.mail,
      "Password Reset OTP",
      `<h2>Password reset</h2><p>Hello ${user.fname}</p><h1>${otpGen}</h1><p>This OTP expires in 15 minutes.</p>`,
    );
  } catch (error) {
    await dbOtp.deleteOne({ _id: otpDoc._id });
    throw error;
  }

  return genToken(process.env.RESET_PASSWORD_SECRET, "15m", {
    userId: user._id,
    otpId: otpDoc._id,
    resetPassword: true,
  });
};

const verifyOTP = async (userId, otpId, otp) => {
  const user = await dbUser.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const otpDb = await dbOtp.findOne({ _id: otpId, userId });
  if (!otpDb) {
    throw new ApiError(400, "OTP not found or expired. Request a new OTP");
  }

  if (otpDb.expireAt <= new Date()) {
    await dbOtp.deleteOne({ _id: otpDb._id });
    throw new ApiError(400, "OTP expired. Request a new OTP");
  }

  if (otpDb.attempts >= 3) {
    await dbOtp.deleteOne({ _id: otpDb._id });
    throw new ApiError(429, "Too many incorrect OTP attempts. Request a new OTP");
  }

  if (String(otp) !== otpDb.otp) {
    otpDb.attempts += 1;

    if (otpDb.attempts >= 3) {
      await dbOtp.deleteOne({ _id: otpDb._id });
      throw new ApiError(429, "Too many incorrect OTP attempts. Request a new OTP");
    }

    await otpDb.save();
    throw new ApiError(400, "The OTP is incorrect");
  }

  await dbOtp.deleteOne({ _id: otpDb._id });

  const resetToken = genToken(process.env.RESET_PASSWORD_SECRET, "15m", {
    userId: user._id,
    resetPassword: true,
    otpVerified: true,
  });

  const resetTokenHash = await bcrypt.hash(resetToken, 10);
  const result = await dbUser.updateOne(
    { _id: user._id },
    { $set: { resetTokenHash } },
  );

  if (result.matchedCount !== 1) {
    throw new ApiError(404, "User not found");
  }

  return resetToken;
};

const resetPassword = async (userId, newPassword) => {
  const user = await dbUser.findById(userId).select("+resetTokenHash");
  if (!user || !user.resetTokenHash) {
    throw new ApiError(404, "User not found or reset token is invalid");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const result = await dbUser.updateOne(
    { _id: userId, resetTokenHash: user.resetTokenHash },
    {
      $set: { password: hashedPassword },
      $unset: { resetTokenHash: 1 },
    },
  );

  if (result.modifiedCount !== 1) {
    throw new ApiError(400, "Reset token is invalid or already used");
  }

  return { message: "Password reset successfully" };
};

const uploadUserImage = async (id, file) => {
  const user = await dbUser.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  const result = await uploadImage(file, id);
  const updatedUser = await dbUser.findByIdAndUpdate(
    id,
    { $set: { image: result.secure_url } },
    { new: true },
  );

  if (!updatedUser) throw new ApiError(404, "User not found");
  return updatedUser;
};

module.exports = {
  createUser,
  Login,
  getUserByID,
  updataInfoToUser,
  getAllUsers,
  updatePassw,
  deleteuserFun,
  forgetPassword,
  verifyOTP,
  resetPassword,
  uploadUserImage,
  googleLoginServices,
};
