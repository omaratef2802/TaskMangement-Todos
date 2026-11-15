const mongoose = require("mongoose");

async function connectDb() {
  const connection =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/todos";
  await mongoose.connect(connection);
  console.log("successfully connected in db in " + connection);
}

module.exports = connectDb;
