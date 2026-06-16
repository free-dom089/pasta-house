const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    available: {
      type: Boolean,
      default: true
    },
    availableFrom: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

productSchema.statics.restoreScheduledAvailability = function restoreScheduledAvailability() {
  return this.updateMany(
    {
      available: false,
      availableFrom: { $ne: null, $lte: new Date() }
    },
    {
      $set: { available: true, availableFrom: null }
    }
  );
};

module.exports = mongoose.model("Product", productSchema);
