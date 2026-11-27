const ApiError = require("../utils/ApiError");
const { createAdmin, setupFirstAdmin, getAdmins } = require("../services/admin");

const validateAdminInput = ({ fname, lname, username, mail, password }) => {
  const values = [fname, lname, username, mail, password];
  if (!values.every((value) => typeof value === "string" && value.trim())) {
    throw new ApiError(400, "Please provide first name, last name, username, email and password");
  }
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");
};

const createAdminAccount = async (req, res, next) => {
  try {
    validateAdminInput(req.body);
    const admin = await createAdmin(req.body);
    res.status(201).json({ message: "Admin account created successfully", data: admin });
  } catch (error) {
    next(error);
  }
};

const setupFirstAdminAccount = async (req, res, next) => {
  try {
    validateAdminInput(req.body);
    const admin = await setupFirstAdmin(req.body);
    res.status(201).json({ message: "Initial administrator created successfully. You can now sign in.", data: admin });
  } catch (error) {
    next(error);
  }
};

const listAdmins = async (req, res, next) => {
  try {
    const admins = await getAdmins();
    res.status(200).json({ message: "success", data: admins });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAdminAccount, setupFirstAdminAccount, listAdmins };
