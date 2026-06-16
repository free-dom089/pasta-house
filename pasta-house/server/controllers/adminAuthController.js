const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const signToken = (admin) => {
  if (!env.JWT_SECRET) {
    throw new ApiError(500, "JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: admin._id, username: admin.username },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const admin = await Admin.findOne({ username }).select("+password");

  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  const token = signToken(admin);
  admin.password = undefined;

  res.json({
    success: true,
    token,
    data: admin
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.admin
  });
});
