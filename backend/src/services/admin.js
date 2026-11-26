const dbUser = require("../modules/dbUser");
const ApiError = require("../utils/ApiError");

const createAdmin = async (data) => {
  const { fname, lname, username, mail, password } = data;
  const existing = await dbUser.findOne({
    $or: [{ mail: mail.trim().toLowerCase() }, { username: username.trim() }],
  });
  if (existing) throw new ApiError(409, "Email or username already exists");

  return dbUser.create({
    fname: fname.trim(),
    lname: lname.trim(),
    username: username.trim(),
    mail: mail.trim().toLowerCase(),
    password,
    role: "Admin",
  });
};

const getAdmins = async () =>
  dbUser.find({ role: "Admin" }).select("fname lname username mail image role createdAt").sort({ createdAt: -1 });

module.exports = { createAdmin, getAdmins };
