const dbUser = require("../modules/dbUser");
const bcrypt = require("bcrypt");
const genToken = require("../utils/gnToken");
const ApiError = require("../utils/ApiError");

const createUser = async (info) => {
  const user = await dbUser.create(info);
  return user;
};
const Login = async (mail, password) => {
  const user = await dbUser.findOne({ mail });
  if (!user) throw new ApiError(404, "password or mail is not corrects");

  const verify = await bcrypt.compare(password, user.password);
  if (!verify) throw new ApiError(404, "password or mail is not corrects");

  return genToken(process.env.SECRET, "1w", {
    userId: user._id,
    role: user.role,
  });
};

const getUserByID = async (id) => {
  return await dbUser.findById(id);
};

const getAllUsers = async (skip = 0, limit = 10) => {
  return await dbUser.find().limit(limit).skip(skip);
};

const updataInfoToUser = async (id, data) => {
  const user = await dbUser.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "the user is not found");
  return user;
};

const updatePassw = async (confirmPassword, newPassword, password, id) => {
  const user = await getUserByID(id);
  if (!user) throw new ApiError(404, "the user is not found");
  const verify = await bcrypt.compare(password, user.password);
  if (!verify) throw new ApiError(404, "the password isn't correct");
  if (confirmPassword != newPassword)
    throw new ApiError(
      404,
      "the confirm password doen't match the new password",
    );
  user.password = newPassword;
  await user.save();
  return user;
};

const deleteuserFun = async (id) => {
  return await dbUser.findByIdAndDelete(id);
};

module.exports = {
  createUser,
  Login,
  getUserByID,
  updataInfoToUser,
  getAllUsers,
  updatePassw,
  deleteuserFun,
};
