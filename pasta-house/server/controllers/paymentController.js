const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const paystack = require("../utils/paystack");

const toKobo = (amount) => Math.round(Number(amount || 0) * 100);

const webhookSecret = () => env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;

const emailForOrder = (order, fallbackEmail) => {
  return fallbackEmail || order.guestEmail || order.customer?.email || "orders@pastahouse.ng";
};

const markPayment = async (reference, verification) => {
  const payment = await Payment.findOne({ reference }).populate("order");
  const order = payment?.order || (await Order.findOne({ paystackReference: reference }));

  if (!order) {
    throw new ApiError(404, "Payment reference not found");
  }

  const expectedAmount = payment ? payment.amount : order.totalAmount;
  if (verification.amount && toKobo(expectedAmount) !== Number(verification.amount)) {
    if (payment) {
      payment.status = "failed";
      payment.gatewayResponse = "Amount mismatch";
      payment.rawResponse = verification;
      await payment.save();
    }
    order.paymentStatus = "failed";
    await order.save();
    throw new ApiError(400, "Payment amount does not match order total");
  }

  const success = verification.status === "success";

  if (payment) {
    payment.status = success ? "success" : "failed";
    payment.gatewayResponse = verification.gateway_response || verification.gatewayResponse;
    payment.paidAt = verification.paid_at ? new Date(verification.paid_at) : undefined;
    payment.rawResponse = verification;
    await payment.save();
  }

  order.paystackReference = reference;
  order.paymentStatus = success ? "paid" : "failed";
  if (success && order.orderStatus === "new") {
    order.orderStatus = "confirmed";
  }
  await order.save();

  return { payment, order, success };
};

exports.initializePayment = asyncHandler(async (req, res) => {
  const { orderId, email } = req.body;

  if (!orderId) {
    throw new ApiError(400, "orderId is required");
  }

  if (!env.PAYSTACK_PUBLIC_KEY) {
    throw new ApiError(500, "PAYSTACK_PUBLIC_KEY is not configured");
  }

  const order = await Order.findById(orderId).populate("customer", "name email phone");
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order has already been paid");
  }

  const reference = `PH-${Date.now()}-${order._id.toString().slice(-6)}`;
  const transaction = await paystack.initializeTransaction({
    email: emailForOrder(order, email),
    amount: toKobo(order.totalAmount),
    currency: "NGN",
    reference,
    metadata: {
      orderId: order._id.toString(),
      customerName: order.customer?.name || order.guestName,
      phone: order.customer?.phone || order.guestPhone,
      deliveryAddress: order.deliveryAddress
    }
  });

  await Payment.create({
    order: order._id,
    reference: transaction.reference || reference,
    accessCode: transaction.access_code,
    authorizationUrl: transaction.authorization_url,
    amount: order.totalAmount,
    currency: "NGN",
    status: "pending",
    rawResponse: transaction
  });

  order.paystackReference = transaction.reference || reference;
  order.paymentStatus = "pending";
  await order.save();

  res.status(201).json({
    success: true,
    data: {
      orderId: order._id,
      reference: transaction.reference || reference,
      accessCode: transaction.access_code,
      authorizationUrl: transaction.authorization_url,
      amount: order.totalAmount,
      currency: "NGN",
      publicKey: env.PAYSTACK_PUBLIC_KEY
    }
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  if (!reference) {
    throw new ApiError(400, "Payment reference is required");
  }

  const verification = await paystack.verifyTransaction(reference);
  const result = await markPayment(reference, verification);

  res.json({
    success: true,
    data: {
      reference,
      paymentStatus: result.success ? "success" : "failed",
      orderPaymentStatus: result.order.paymentStatus,
      order: result.order
    }
  });
});

exports.webhook = asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const secret = webhookSecret();

  if (secret) {
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      throw new ApiError(401, "Invalid Paystack webhook signature");
    }
  }

  const event = Buffer.isBuffer(req.body) ? JSON.parse(rawBody.toString("utf8")) : req.body;

  if (event.event === "charge.success" && event.data?.reference) {
    await markPayment(event.data.reference, event.data);
  }

  res.status(200).json({ received: true });
});
