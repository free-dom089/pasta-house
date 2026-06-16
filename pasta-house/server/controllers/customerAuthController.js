const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const signCustomerToken = (customer) => {
  if (!env.CUSTOMER_JWT_SECRET) {
    throw new ApiError(500, "CUSTOMER_JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: customer._id, name: customer.name, email: customer.email },
    env.CUSTOMER_JWT_SECRET,
    { expiresIn: env.CUSTOMER_JWT_EXPIRES_IN }
  );
};

const serializeCustomer = (customer) => {
  const doc = customer.toObject ? customer.toObject() : customer;
  delete doc.password;
  return doc;
};

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, savedAddress } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const exists = await Customer.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const customer = await Customer.create({
    name,
    email,
    password,
    phone,
    savedAddress
  });

  res.status(201).json({
    success: true,
    token: signCustomerToken(customer),
    data: serializeCustomer(customer)
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!customer || !(await customer.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  res.json({
    success: true,
    token: signCustomerToken(customer),
    data: serializeCustomer(customer)
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.customer
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  ["name", "phone", "savedAddress"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  });

  const customer = await Customer.findByIdAndUpdate(req.customer._id, updates, {
    new: true,
    runValidators: true
  }).select("-password");

  res.json({
    success: true,
    data: customer
  });
});
