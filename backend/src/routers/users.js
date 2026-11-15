const express = require("express");
const router = express.Router();

const {
  getUserById,
  getUsers,
  register,
  login,
  updateUser,
  deleteUser,
  updatePassword,
} = require("../controllers/user");

const { auth, relasedTo } = require("../middlewares/auth");

router.get("/MyUsers", auth, relasedTo("Admin"), getUsers);
router.get("/MyProfile", auth, getUserById);
router.post("/signin", register);
router.post("/login", login);
router.patch("/updateProfile", auth, updateUser);
router.patch("/updatePassword", auth, updatePassword);
router.delete("/deleteUsers", auth, relasedTo("Admin"), deleteUser);

module.exports = router;
