const mongoose = require("mongoose");

const cropInsightSchema = new mongoose.Schema({

  crop_name: {
    type: String,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  date: {
    type: String,
    required: true
  },

  trending_score: Number,
  trending_label: String,
  market_summary: String,

  price_history: [{
    year: String,
    avg_price: Number,
    unit: String
  }],

  demand_trend: String,

  profit_potential: {
    investment_per_acre: Number,
    expected_yield_per_acre: String,
    expected_revenue_per_acre: Number,
    estimated_profit_per_acre: Number,
    roi_percentage: Number
  },

  growth_duration: String,
  best_months_to_sow: String,
  risks: [String],
  benefits: [String],
  local_demand_rank: Number,
  recommendation_reason: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

// Compound index for fast cache lookups
cropInsightSchema.index({ crop_name: 1, location: 1, date: 1 });

module.exports = mongoose.model("CropInsight", cropInsightSchema);
