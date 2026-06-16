const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

exports.getAllProducts = asyncHandler(async (req, res) => {
  await Product.restoreScheduledAvailability();
  const products = await Product.find().sort({ category: 1, createdAt: 1 });

  res.json({
    success: true,
    data: products
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  await Product.restoreScheduledAvailability();
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({
    success: true,
    data: product
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({
    success: true,
    data: product
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.json({
    success: true,
    message: "Product deleted successfully"
  });
});
