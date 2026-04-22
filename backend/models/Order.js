const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  consumer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    unit: String,
    qty: Number,
    image: String
  }],

  totalAmount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "preparing", "ready", "picked_up", "cancelled"],
    default: "pending"
  },

  deliveryAddress: {
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },

  note: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

orderSchema.index({ consumer: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);
