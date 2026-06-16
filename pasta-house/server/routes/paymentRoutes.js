const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/initialize", paymentController.initializePayment);
router.get("/verify/:reference", paymentController.verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), paymentController.webhook);
router.post("/paystack/webhook", express.raw({ type: "application/json" }), paymentController.webhook);

module.exports = router;
