const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Admin = require("../models/Admin");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const adminAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  if (!env.JWT_SECRET) {
    throw new ApiError(500, "JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);
  const admin = await Admin.findById(decoded.id).select("-password");

  if (!admin) {
    throw new ApiError(401, "Invalid admin session");
  }

  req.admin = admin;
  next();
});

module.exports = adminAuth;
