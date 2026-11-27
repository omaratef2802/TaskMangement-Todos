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
  uploadUserImage,
  googleLoginServices,
} = require("../services/user");

const register = async (req, res, next) => {
  try {
    const { fname, lname, username, mail, password } = req.body;
    if (
      ![fname, lname, username, mail, password].every(
        (value) => typeof value === "string" && value.trim(),
      )
    ) {
      throw new ApiError(
        400,
        "Please provide all required registration fields",
      );
    }

    if (password.length < 8)
      throw new ApiError(400, "Password must be at least 8 characters");

    res.status(201).json({
      message: "success",
      data: await createUser({ fname, lname, username, mail, password }),
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { mail, password } = req.body;
    if (
      typeof mail !== "string" ||
      !mail.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      throw new ApiError(400, "Please provide email and password");
    }

    res.status(200).json({
      message: "success",
      data: await Login(mail, password),
    });
  } catch (err) {
    next(err);
  }
};

const googleAuthCallback = async (req, res, next) => {
  try {
    const data = await googleLoginServices(req.user);
    res.status(200).json({
      message: "Google login successful",
      data,
    });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await updataInfoToUser(req.id, req.body);
    res.status(200).json({ message: "success", data: user });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByID(req.id);
    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json({ message: "success", data: user });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new ApiError(
        400,
        "Page must be positive and limit must be between 1 and 100",
      );
    }

    const users = await getAllUsers(page, limit);
    res.status(200).json({ message: "success", data: users });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await deleteuserFun(req.params.id || req.id);
    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { confirmPassword, newPassword } = req.body;
    const currentPassword = req.body.Password || req.body.password;

    if (
      typeof confirmPassword !== "string" ||
      typeof newPassword !== "string" ||
      !confirmPassword ||
      !newPassword
    ) {
      throw new ApiError(
        400,
        "Please provide the new password and confirmation",
      );
    }

    if (newPassword.length < 8)
      throw new ApiError(400, "Password must be at least 8 characters");

    const user = await updatePassw(
      confirmPassword,
      newPassword,
      currentPassword,
      req.id,
    );

    res.status(200).json({ message: "success", data: user });
  } catch (err) {
    next(err);
  }
};

const ForgetPassword = async (req, res, next) => {
  try {
    const { mail } = req.body;
    if (typeof mail !== "string" || !mail.trim())
      throw new ApiError(400, "Please provide a valid email");

    res.status(200).json({
      message: "OTP sent successfully",
      data: await forgetPassword(mail),
    });
  } catch (err) {
    next(err);
  }
};

const VerifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (typeof otp !== "string" || !/^[0-9]{6}$/.test(otp)) {
      throw new ApiError(400, "OTP must contain exactly 6 digits");
    }

    res.status(200).json({
      message: "OTP verified successfully",
      data: await verifyOTP(req.id, req.otpId, otp),
    });
  } catch (err) {
    next(err);
  }
};

const ResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== "string" || !newPassword) {
      throw new ApiError(400, "Please provide the new password");
    }
    if (newPassword.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    res.status(200).json({
      message: "success",
      data: await resetPassword(req.id, newPassword),
    });
  } catch (err) {
    next(err);
  }
};

const uploadImageUser = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "Please upload an image");

    const user = await uploadUserImage(req.id, req.file);
    res.status(200).json({
      message: "Image uploaded successfully",
      data: user,
    });
  } catch (err) {
    next(err);
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
  uploadImageUser,
  googleAuthCallback,
};
