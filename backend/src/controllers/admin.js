const ApiError = require("../utils/ApiError");
const { createAdmin, getAdmins } = require("../services/admin");

const createAdminAccount = async (req, res, next) => {
  try {
    const { fname, lname, username, mail, password } = req.body;
    const values = [fname, lname, username, mail, password];
    if (!values.every((value) => typeof value === "string" && value.trim())) {
      throw new ApiError(400, "Please provide first name, last name, username, email and password");
    }
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const admin = await createAdmin({ fname, lname, username, mail, password });
    res.status(201).json({ message: "Admin account created successfully", data: admin });
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

module.exports = { createAdminAccount, listAdmins };
