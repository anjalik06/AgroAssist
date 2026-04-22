const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  price: {
    type: Number,
    required: true
  },

  unit: {
    type: String,
    default: "kg"
  },

  category: {
    type: String,
    enum: ["vegetables", "fruits", "grains", "dairy", "other"],
    default: "vegetables"
  },

  image: {
    type: String,
    default: ""
  },

  quantity: {
    type: Number,
    default: 50
  },

  stock: {
    type: String,
    enum: ["available", "limited", "out_of_stock"],
    default: "available"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

productSchema.index({ farmer: 1 });
productSchema.index({ isActive: 1, category: 1 });

module.exports = mongoose.model("Product", productSchema);
