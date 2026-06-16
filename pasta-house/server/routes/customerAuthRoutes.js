const express = require("express");
const customerAuthController = require("../controllers/customerAuthController");
const orderController = require("../controllers/orderController");
const { requireCustomer } = require("../middleware/customerAuth");

const router = express.Router();

router.post("/signup", customerAuthController.signup);
router.post("/login", customerAuthController.login);
router.get("/me", requireCustomer, customerAuthController.getProfile);
router.put("/me", requireCustomer, customerAuthController.updateProfile);
router.patch("/me", requireCustomer, customerAuthController.updateProfile);
router.get("/me/orders", requireCustomer, orderController.getCustomerOrders);

module.exports = router;
