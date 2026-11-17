const bcrypt = require("bcrypt");
const ApiError = require("../utils/ApiError");
const {
  createUser,
  Login,
  getUserByID,
  updataInfoToUser,
  getAllUsers,
  updatePassw,
  deleteuserFun,
  forgetPassword,
  resetPassword,
  verifyOTP,
} = require("../services/user");

const register = async (req, res, next) => {
  try {
    const { fname, lname, username, mail, password } = req.body;
    res.status(201).json({
      message: "success",
      data: await createUser({ fname, lname, username, mail, password }),
    });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const login = async (req, res, next) => {
  try {
    const { mail, password } = req.body;
    if (!mail || !password)
      return res.status(404).json({
        message: "Error",
        data: "must provide me the mail and passwrod",
      });

    res
      .status(200)
      .json({ message: "success", data: await Login(mail, password) });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const updateUser = async (req, res, next) => {
  try {
    const newUser = await updataInfoToUser(req.id, req.body);
    if (!newUser) return new ApiError(404, "failed operation");

    res.status(200).json({ message: "success", data: newUser });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByID(req.id);
    if (!user)
      res.status(404).json({ message: "erro", data: "user not found" });

    res.status(200).json({ message: "success", data: user });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.params;
    const users = await getAllUsers(page, limit);
    res.status(200).json({ message: "success ", data: users });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};
const deleteUser = async (req, res, next) => {
  try {
    const user = await deleteuserFun(req.id);
    if (!user)
      return res.status(404).json({ message: "Error", data: "user not found" });

    res
      .status(203)
      .json({ message: "success", data: "user deleted succeefuly" });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { confirmPassword, newPassword, Password } = req.body;

    if (!confirmPassword || !newPassword || !Password)
      return res.status(404).json({
        message:
          "please provide me the password and new password and confirm password",
      });

    const user = await updatePassw(
      confirmPassword,
      newPassword,
      Password,
      req.id,
    );

    res.status(200).json({ message: "success", data: user });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const ForgetPassword = async (req, res, next) => {
  try {
    const { mail } = req.body;
    if (!mail) {
      throw new ApiError(400, "Please provide your email");
    }

    res.status(200).json({
      message: "OTP sent successfully",
      data: await forgetPassword(mail),
    });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const VerifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      throw new ApiError(400, "Please provide the OTP");
    }

    res.status(200).json({
      message: "OTP verified successfully",
      data: await verifyOTP(req.id, otp),
    });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

const ResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      throw new ApiError(400, "Please provide the new password");
    }

    res.status(200).json({
      message: "success",
      data: await resetPassword(req.id, newPassword),
    });
  } catch (err) {
    return next(new ApiError(500, err.message));
  }
};

module.exports = {
  getUserById,
  getUsers,
  register,
  login,
  updateUser,
  deleteUser,
  updatePassword,
  ForgetPassword,
  VerifyOTP,
  ResetPassword,
};
