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

const setupFirstAdmin = async (data) => {
  const lockCollection = dbUser.db.collection("admin_bootstrap_locks");
  if (await dbUser.countDocuments({ role: "Admin" })) {
    throw new ApiError(403, "An administrator already exists. Sign in instead.");
  }

  try {
    await lockCollection.insertOne({ _id: "initial-admin", createdAt: new Date() });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(403, "Initial administrator setup has already been used.");
    }
    throw error;
  }

  try {
    if (await dbUser.countDocuments({ role: "Admin" })) {
      throw new ApiError(403, "An administrator already exists. Sign in instead.");
    }
    return await createAdmin(data);
  } catch (error) {
    await lockCollection.deleteOne({ _id: "initial-admin" });
    throw error;
  }
};

const getAdmins = async () =>
  dbUser.find({ role: "Admin" }).select("fname lname username mail image role createdAt").sort({ createdAt: -1 });

module.exports = { createAdmin, setupFirstAdmin, getAdmins };
