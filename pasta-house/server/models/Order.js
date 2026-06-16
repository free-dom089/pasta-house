const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderExtraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },
    guestName: {
      type: String,
      trim: true
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    guestPhone: {
      type: String,
      trim: true
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(items) => items.length > 0, "Order requires at least one item"]
    },
    extras: {
      type: [orderExtraSchema],
      default: []
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    paystackReference: {
      type: String,
      trim: true,
      index: true
    },
    orderStatus: {
      type: String,
      enum: ["new", "confirmed", "preparing", "out_for_delivery", "completed"],
      default: "new"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
