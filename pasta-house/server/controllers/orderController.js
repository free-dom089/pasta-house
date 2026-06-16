const Order = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const normalizeItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "items must contain at least one product");
  }

  const normalized = [];

  for (const item of items) {
    const productId = item.product || item.productId || item.id;
    const quantity = Math.max(1, Number(item.quantity || 1));

    if (!productId) {
      throw new ApiError(400, "Each item requires a product id");
    }

    const product = await Product.findOne({ _id: productId, available: true });
    if (!product || product.category.toLowerCase() === "extras") {
      throw new ApiError(404, "One or more menu items were not found or are unavailable");
    }

    normalized.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity
    });
  }

  return normalized;
};

const normalizeExtras = async (extras) => {
  if (!Array.isArray(extras) || extras.length === 0) return [];

  const normalized = [];

  for (const extra of extras) {
    const productId = extra.product || extra.productId || extra.id;

    if (productId) {
      const product = await Product.findOne({ _id: productId, available: true });
      if (!product || product.category.toLowerCase() !== "extras") {
        throw new ApiError(404, "One or more extras were not found or are unavailable");
      }
      normalized.push({ name: product.name, price: product.price });
      continue;
    }

    if (!extra.name || Number(extra.price) < 0) {
      throw new ApiError(400, "Each extra requires a name and price");
    }

    normalized.push({
      name: extra.name,
      price: Number(extra.price)
    });
  }

  return normalized;
};

const customerName = (order) => order.customer?.name || order.guestName || "Guest";

exports.createOrder = asyncHandler(async (req, res) => {
  await Product.restoreScheduledAvailability();

  const {
    guestName,
    guestEmail,
    guestPhone,
    deliveryAddress,
    items,
    extras
  } = req.body;

  const customer = req.customer || null;
  const name = customer ? guestName || customer.name : guestName;
  const email = customer ? guestEmail || customer.email : guestEmail;
  const phone = customer ? guestPhone || customer.phone : guestPhone;
  const address = deliveryAddress || (customer && customer.savedAddress);

  if (!name || !email || !phone || !address) {
    throw new ApiError(400, "Name, email, phone, and delivery address are required");
  }

  const normalizedItems = await normalizeItems(items);
  const normalizedExtras = await normalizeExtras(extras);
  const itemTotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const extrasTotal = normalizedExtras.reduce((sum, extra) => sum + extra.price, 0);

  const order = await Order.create({
    customer: customer ? customer._id : null,
    guestName: name,
    guestEmail: email,
    guestPhone: phone,
    deliveryAddress: address,
    items: normalizedItems,
    extras: normalizedExtras,
    totalAmount: itemTotal + extrasTotal,
    paymentStatus: "pending",
    orderStatus: "new"
  });

  res.status(201).json({
    success: true,
    data: order
  });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "name email phone")
    .populate("items.product", "name category image price");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.json({
    success: true,
    data: order
  });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("customer", "name email phone")
    .populate("items.product", "name category image price")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders.map((order) => ({
      ...order.toObject(),
      customerName: customerName(order)
    }))
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  if (!orderStatus) {
    throw new ApiError(400, "orderStatus is required");
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus },
    { new: true, runValidators: true }
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.json({
    success: true,
    data: order
  });
});

exports.getCustomerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.customer._id })
    .populate("items.product", "name category image price")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders
  });
});
