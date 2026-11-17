const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { authResetPassword } = require("../middlewares/authResetPassword");
const {
  getUserById,
  getUsers,
  register,
  login,
  updateUser,
  deleteUser,
  ForgetPassword,
  VerifyOTP,
  ResetPassword,
  updatePassword,
  uploadImageUser,
} = require("../controllers/user");

const { auth, relasedTo } = require("../middlewares/auth");

router.get("/MyUsers", auth, relasedTo("Admin"), getUsers);
router.get("/MyProfile", auth, getUserById);
router.post("/signin", register);
router.post("/login", login);
router.patch("/updateProfile", auth, updateUser);
router.patch("/updatePassword", auth, updatePassword);
router.delete("/deleteUsers", auth, relasedTo("Admin"), deleteUser);
router.patch("/uploadImage", auth, upload.single("image"), uploadImageUser);
router.post("/forgetPassword", ForgetPassword);
router.post("/verifyOTP", authResetPassword, VerifyOTP);
router.patch("/resetPassword", authResetPassword, ResetPassword);

module.exports = router;
