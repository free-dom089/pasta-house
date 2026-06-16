const jwt = require("jsonwebtoken");
const env = require("../config/env");
const Customer = require("../models/Customer");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const decodeCustomer = async (token) => {
  if (!env.CUSTOMER_JWT_SECRET) {
    throw new ApiError(500, "CUSTOMER_JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, env.CUSTOMER_JWT_SECRET);
  const customer = await Customer.findById(decoded.id).select("-password");

  if (!customer) {
    throw new ApiError(401, "Invalid customer session");
  }

  return customer;
};

const requireCustomer = asyncHandler(async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    throw new ApiError(401, "Customer authentication token is required");
  }

  req.customer = await decodeCustomer(token);
  next();
});

const optionalCustomer = asyncHandler(async (req, res, next) => {
  const token = readToken(req);

  if (!token) return next();

  req.customer = await decodeCustomer(token);
  next();
});

module.exports = {
  requireCustomer,
  optionalCustomer
};
