const express = require("express");
const orderController = require("../controllers/orderController");
const adminAuth = require("../middleware/adminAuth");
const { optionalCustomer } = require("../middleware/customerAuth");

const router = express.Router();

router.post("/", optionalCustomer, orderController.createOrder);
router.get("/", adminAuth, orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id/status", adminAuth, orderController.updateOrderStatus);
router.patch("/:id/status", adminAuth, orderController.updateOrderStatus);

module.exports = router;
