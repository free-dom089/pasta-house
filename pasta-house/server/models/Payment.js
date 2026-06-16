const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    accessCode: {
      type: String,
      trim: true
    },
    authorizationUrl: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "NGN"
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },
    gatewayResponse: {
      type: String,
      trim: true
    },
    paidAt: Date,
    rawResponse: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
