const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  date: String,

  location: String,
  season: String,
  soil_type: String,

  weather: {
    temperature: Number,
    humidity: Number,
    wind_speed: Number
  },

  top_crops: [
    {
      name: String,
      category: String,
      rank: Number
    }
  ],

  warnings: [String],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Recommendation", RecommendationSchema);