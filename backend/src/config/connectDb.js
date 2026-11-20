const mongoose = require("mongoose");

async function connectDb() {
  const connection =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/todos";
  await mongoose.connect(connection);
  console.log("Successfully connected to MongoDB");
}

module.exports = connectDb;
