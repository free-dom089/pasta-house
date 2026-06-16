const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.get("/", adminAuth, asyncHandler(async (req, res) => {
  const customers = await Customer.find().select("-password").sort({ createdAt: -1 });

  const customerIds = customers.map((c) => c._id);
  const orderCounts = await Order.aggregate([
    { $match: { customer: { $in: customerIds } } },
    { $group: { _id: "$customer", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  orderCounts.forEach((item) => {
    countMap[item._id.toString()] = item.count;
  });

  const data = customers.map((c) => ({
    ...c.toObject(),
    orderCount: countMap[c._id.toString()] || 0
  }));

  res.json({ success: true, data });
}));

module.exports = router;
