const mongoose = require("mongoose");

const MarketPriceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: String,
  category: { type: String, enum: ["vegetable", "fruit", "grain"] },
  unit: { type: String, default: "kg" },
  currentPrice: Number,
  previousPrice: Number,
  history: [
    {
      price: Number,
      date: String
    }
  ],
  dataSource: { type: String, enum: ["real", "simulated"], default: "simulated" },
  high7d: Number,
  low7d: Number,
  lastUpdated: { type: String }
});

module.exports = mongoose.model("MarketPrice", MarketPriceSchema);
