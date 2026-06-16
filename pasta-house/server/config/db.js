const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(env.MONGODB_URI);
  console.log("MongoDB connected");
};

module.exports = connectDB;
