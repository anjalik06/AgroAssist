const express = require("express");
const router = express.Router();

const Recommendation = require("../models/Recommendation");
const CropInsight = require("../models/CropInsight");
const genAI = require("../config/gemini");

function isGeminiAuthError(err) {
  if (!err) return false;
  if (err.status === 401) return true;

  const details = Array.isArray(err.errorDetails) ? err.errorDetails : [];
  return details.some((detail) => detail && detail.reason === "API_KEY_INVALID");
}

// Helper: generate insights for crops and save to DB
async function generateAndSaveInsights(location, topCrops, season, soilType, date) {

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const cropList = topCrops.map(c => `${c.rank}. ${c.name} (${c.category})`).join("\n");

  const prompt = `
You are an agricultural market analyst AI.

A farmer at "${location}" is growing crops in "${season}" season with "${soilType}" soil.

Provide market insights for these crops:
${cropList}

Return ONLY valid JSON array:
[
  {
    "crop_name": "",
    "trending_score": 0,
    "trending_label": "",
    "market_summary": "",
    "price_history": [
      {"year": "2021", "avg_price": 0, "unit": "₹/quintal"},
      {"year": "2022", "avg_price": 0, "unit": "₹/quintal"},
      {"year": "2023", "avg_price": 0, "unit": "₹/quintal"},
      {"year": "2024", "avg_price": 0, "unit": "₹/quintal"},
      {"year": "2025", "avg_price": 0, "unit": "₹/quintal"}
    ],
    "demand_trend": "",
    "profit_potential": {
      "investment_per_acre": 0,
      "expected_yield_per_acre": "",
      "expected_revenue_per_acre": 0,
      "estimated_profit_per_acre": 0,
      "roi_percentage": 0
    },
    "growth_duration": "",
    "best_months_to_sow": "",
    "risks": [],
    "benefits": [],
    "local_demand_rank": 0,
    "recommendation_reason": ""
  }
]

Rules:
- trending_score: 1-100, trending_label: "Hot"(75-100)/"Rising"(50-74)/"Stable"(25-49)/"Declining"(0-24)
- price_history: realistic INR prices per quintal for this region
- demand_trend: "Increasing"/"Stable"/"Decreasing"
- profit_potential: realistic Indian farming values in INR
- risks: 3-4 items, benefits: 3-4 items, local_demand_rank: 1-10
- Array must have exactly ${topCrops.length} entries, one per crop
- DO NOT include markdown. ONLY JSON array.
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

  const insightDocs = parsed.map(insight => ({
    crop_name: insight.crop_name,
    location: location,
    date: date,
    trending_score: insight.trending_score || 0,
    trending_label: insight.trending_label || "Stable",
    market_summary: insight.market_summary || "",
    price_history: insight.price_history || [],
    demand_trend: insight.demand_trend || "Stable",
    profit_potential: insight.profit_potential || {},
    growth_duration: insight.growth_duration || "",
    best_months_to_sow: insight.best_months_to_sow || "",
    risks: insight.risks || [],
    benefits: insight.benefits || [],
    local_demand_rank: insight.local_demand_rank || 5,
    recommendation_reason: insight.recommendation_reason || ""
  }));

  if (insightDocs.length > 0) {
    await CropInsight.insertMany(insightDocs);
  }

  return insightDocs;
}

// ============================================
// POST /recommend
// - Checks DB cache first (by coordinates, any date)
// - If same location exists in DB, return cached data (no Gemini call)
// - If new location: calls Gemini ONCE, saves to DB
// - If Gemini fails: fallback to most recent DB data
// ============================================

router.post("/recommend", async (req, res) => {

try {

let { latitude, longitude } = req.body;

latitude = Number(latitude.toFixed(3));
longitude = Number(longitude.toFixed(3));

const today = new Date().toISOString().split("T")[0];

// 1. Check if this location exists in DB for today
const existing = await Recommendation.findOne({
  latitude,
  longitude,
  date: today
});

if (existing) {
  const insightCount = await CropInsight.countDocuments({
    location: existing.location,
    date: today
  });

  // Backfill insights if missing
  if (insightCount === 0 && existing.top_crops && existing.top_crops.length > 0) {
    try {
      console.log("Backfilling insights for", existing.location);
      await generateAndSaveInsights(existing.location, existing.top_crops, existing.season, existing.soil_type, today);
      console.log("Backfill complete");
    } catch (err) {
      console.log("Failed to backfill insights:", err);
    }
  }

  return res.json({
    source: "database",
    data: existing,
    insightsReady: insightCount > 0 || (existing.top_crops && existing.top_crops.length > 0)
  });
}

// 2. New location — call Gemini ONCE for recommendation + all insights
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

const prompt = `
You are an agricultural AI assistant and market analyst.

Based on this location:
Latitude: ${latitude}
Longitude: ${longitude}

Do TWO things in a SINGLE response:

PART 1 - CROP RECOMMENDATION:
Identify the location, current farming season, soil type, weather, top 5 crops, and warnings.

PART 2 - MARKET INSIGHTS FOR EACH CROP:
For each of the 5 recommended crops, provide detailed market insight for THIS specific region.

Return ONLY valid JSON in this exact format:

{
  "recommendation": {
    "location": "",
    "season": "",
    "soil_type": "",
    "weather": {
      "temperature": 0,
      "humidity": 0,
      "wind_speed": 0
    },
    "top_crops": [
      {"name": "", "category": "", "rank": 1},
      {"name": "", "category": "", "rank": 2},
      {"name": "", "category": "", "rank": 3},
      {"name": "", "category": "", "rank": 4},
      {"name": "", "category": "", "rank": 5}
    ],
    "warnings": []
  },
  "insights": [
    {
      "crop_name": "",
      "trending_score": 0,
      "trending_label": "",
      "market_summary": "",
      "price_history": [
        {"year": "2021", "avg_price": 0, "unit": "₹/quintal"},
        {"year": "2022", "avg_price": 0, "unit": "₹/quintal"},
        {"year": "2023", "avg_price": 0, "unit": "₹/quintal"},
        {"year": "2024", "avg_price": 0, "unit": "₹/quintal"},
        {"year": "2025", "avg_price": 0, "unit": "₹/quintal"}
      ],
      "demand_trend": "",
      "profit_potential": {
        "investment_per_acre": 0,
        "expected_yield_per_acre": "",
        "expected_revenue_per_acre": 0,
        "estimated_profit_per_acre": 0,
        "roi_percentage": 0
      },
      "growth_duration": "",
      "best_months_to_sow": "",
      "risks": [],
      "benefits": [],
      "local_demand_rank": 0,
      "recommendation_reason": ""
    }
  ]
}

Rules:
- temperature in Celsius, humidity in %, wind_speed in km/h
- rank 1-5 (1 = best). Rank crops by trending_score (highest trending = rank 1)
- trending_score: 1-100 (how trending/profitable this crop is in this region)
- trending_label: "Hot" (75-100), "Rising" (50-74), "Stable" (25-49), "Declining" (0-24)
- price_history: realistic average market prices for this crop in this region per quintal in INR
- demand_trend: "Increasing", "Stable", or "Decreasing"
- profit_potential: realistic values for Indian farming in INR
- growth_duration: e.g. "90-120 days"
- risks: 3-4 short risk factors
- benefits: 3-4 short benefit points
- local_demand_rank: 1-10
- The insights array must have exactly 5 entries, one per recommended crop, in same order as top_crops
- DO NOT include markdown or explanation
- ONLY JSON
`;

let result;
try {
  result = await model.generateContent(prompt);
} catch (geminiErr) {
  console.log("Gemini API failed:", geminiErr.message);

  // Fallback: only return data for the SAME location from a previous date
  const fallback = await Recommendation.findOne({ latitude, longitude }).sort({ createdAt: -1 });
  if (fallback) {
    const insightCount = await CropInsight.countDocuments({ location: fallback.location });
    return res.json({
      source: "database",
      data: fallback,
      insightsReady: insightCount > 0 || (fallback.top_crops && fallback.top_crops.length > 0)
    });
  }

  if (isGeminiAuthError(geminiErr)) {
    return res.status(503).json({
      message: "Gemini API key is invalid. Update GEMINI_API_KEY in backend .env and restart the server."
    });
  }
  return res.status(500).json({ message: "Service temporarily unavailable. Please try again later." });
}

let text = result.response.text();

text = text.replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

const jsonStart = text.indexOf("{");
const jsonEnd = text.lastIndexOf("}");
const jsonString = text.slice(jsonStart, jsonEnd + 1);

const parsed = JSON.parse(jsonString);

// 3. Extract and validate recommendation
const rec = parsed.recommendation;
rec.weather = rec.weather || { temperature: null, humidity: null, wind_speed: null };
rec.top_crops = rec.top_crops || [];
rec.warnings = rec.warnings || [];

// 4. Save recommendation to DB
const newRec = await Recommendation.create({
  latitude,
  longitude,
  date: today,
  ...rec
});

// 5. Save all crop insights to DB (batch insert)
const insights = parsed.insights || [];
const insightDocs = insights.map(insight => ({
  crop_name: insight.crop_name,
  location: rec.location,
  date: today,
  trending_score: insight.trending_score || 0,
  trending_label: insight.trending_label || "Stable",
  market_summary: insight.market_summary || "",
  price_history: insight.price_history || [],
  demand_trend: insight.demand_trend || "Stable",
  profit_potential: insight.profit_potential || {},
  growth_duration: insight.growth_duration || "",
  best_months_to_sow: insight.best_months_to_sow || "",
  risks: insight.risks || [],
  benefits: insight.benefits || [],
  local_demand_rank: insight.local_demand_rank || 5,
  recommendation_reason: insight.recommendation_reason || ""
}));

if (insightDocs.length > 0) {
  await CropInsight.insertMany(insightDocs);
}

// 6. Return recommendation
res.json({
  source: "gemini",
  data: newRec
});

} catch (err) {

console.log("Recommendation Error:", err);

res.status(500).json({
  message: "Recommendation failed"
});

}

});

// ============================================
// POST /insight
// - Only reads from DB (cached by /recommend)
// - No Gemini call — zero API usage
// ============================================

router.post("/insight", async (req, res) => {

try {

const { cropName, location } = req.body;

const today = new Date().toISOString().split("T")[0];

// Build a regex that matches the crop name flexibly
// e.g. "Maize" matches "Maize", "Maize (Corn)", "Corn (Maize)" etc.
const escapedName = cropName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cropRegex = new RegExp(escapedName, "i");

// 1. Try exact match today
let insight = await CropInsight.findOne({
  crop_name: cropRegex,
  location: location,
  date: today
});

// 2. Try exact match any date (most recent)
if (!insight) {
  insight = await CropInsight.findOne({
    crop_name: cropRegex,
    location: location
  }).sort({ createdAt: -1 });
}

// 3. Try matching just by location + date and find closest crop name
if (!insight) {
  const allInsights = await CropInsight.find({
    location: location,
    date: today
  });

  if (allInsights.length > 0) {
    const lowerCrop = cropName.toLowerCase();
    insight = allInsights.find(i => {
      const dbName = i.crop_name.toLowerCase();
      return dbName.includes(lowerCrop) || lowerCrop.includes(dbName);
    });
  }
}

// 4. Last resort — any location, any date, regex match
if (!insight) {
  insight = await CropInsight.findOne({
    crop_name: cropRegex
  }).sort({ createdAt: -1 });
}

if (!insight) {
  return res.status(404).json({
    success: false,
    message: "No insight data available. Please go back and refresh recommendations first."
  });
}

res.json({
  success: true,
  source: "database",
  data: insight
});

} catch (err) {

console.log("Crop Insight Error:", err);

res.status(500).json({
  message: "Failed to fetch crop insight"
});

}

});

module.exports = router;
