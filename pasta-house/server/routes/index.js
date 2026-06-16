const express = require("express");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const customerAuthRoutes = require("./customerAuthRoutes");
const customerListRoutes = require("./customerListRoutes");
const adminAuthRoutes = require("./adminAuthRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/customers", customerAuthRoutes);
router.use("/customers-list", customerListRoutes);
router.use("/admin", adminAuthRoutes);

module.exports = router;
