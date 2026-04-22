const express = require("express");
const router = express.Router();
const MarketPrice = require("../models/MarketPrice");

const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;
const DATA_GOV_RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const DATA_GOV_URL = `https://api.data.gov.in/resource/${DATA_GOV_RESOURCE}`;

// UI Mapping
const CROP_MAP = {
  Tomato: { icon: "tomato", category: "vegetable" },
  Onion: { icon: "onion", category: "vegetable" },
  Potato: { icon: "potato", category: "vegetable" },
  Rice: { icon: "rice", category: "grain" },
  Wheat: { icon: "wheat", category: "grain" },
  Banana: { icon: "banana", category: "fruit" },
  Mango: { icon: "mango", category: "fruit" },
  Carrot: { icon: "carrot", category: "vegetable" },
  Cabbage: { icon: "cabbage", category: "vegetable" },
  Spinach: { icon: "spinach", category: "vegetable" },
  Brinjal: { icon: "brinjal", category: "vegetable" },
  Apple: { icon: "apple", category: "fruit" },
  Papaya: { icon: "papaya", category: "fruit" },
  Guava: { icon: "guava", category: "fruit" },
  Maize: { icon: "maize", category: "grain" },
  "Okra (Bhindi)": { icon: "okra", category: "vegetable", displayName: "Okra" },
  "Green Peas": { icon: "peas", category: "vegetable", displayName: "Peas" },
  Pomegranate: { icon: "pomegranate", category: "fruit" },
  Capsicum: { icon: "capsicum", category: "vegetable" },
  Lemon: { icon: "lemon", category: "fruit" },
  "Ginger (Green)": { icon: "ginger", category: "vegetable", displayName: "Ginger" },
};

// API Commodity Mapping
const API_COMMODITY_MAP = {
  Tomato: "Tomato",
  Onion: "Onion",
  Potato: "Potato",
  Rice: "Rice",
  Wheat: "Wheat",
  Banana: "Banana",
  Mango: "Mango",
  Carrot: "Carrot",
  Cabbage: "Cabbage",
  Spinach: "Spinach",
  Brinjal: "Brinjal",
  Apple: "Apple",
  Papaya: "Papaya",
  Guava: "Guava",
  Maize: "Maize",
  "Okra (Bhindi)": "Bhindi",
  "Green Peas": "Peas Wet",
  Pomegranate: "Pomegranate",
  Capsicum: "Capsicum",
  Lemon: "Lemon",
  "Ginger (Green)": "Ginger",
};

const DUMMY_MIN = 18;
const DUMMY_MAX = 160;
const AUTO_REAL_RETRY_MS = 6 * 60 * 60 * 1000; // 6 hours
let lastAutoRealAttemptAt = 0;
const todayStr = () => new Date().toISOString().split("T")[0];

function priceHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDummyPrice(name, dateStr) {
  const seed = `${name}:${dateStr}`;
  const value = DUMMY_MIN + (priceHash(seed) % ((DUMMY_MAX - DUMMY_MIN) * 10));
  return Math.round(value) / 10;
}

async function fetchDataGovRecords(filters = {}, limit = 5000) {
  const params = new URLSearchParams({
    "api-key": DATA_GOV_API_KEY,
    format: "json",
    limit: String(limit),
  });

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(`filters[${key}]`, value);
    }
  }

  const url = `${DATA_GOV_URL}?${params}`;
  console.log("Fetching:", url);

  const res = await fetch(url);
  const data = await res.json();
  return Array.isArray(data.records) ? data.records : [];
}

function normalizeCommodityName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildAliasMap() {
  return {
    Tomato: ["tomato"],
    Onion: ["onion"],
    Potato: ["potato"],
    Rice: ["rice"],
    Wheat: ["wheat"],
    Banana: ["banana"],
    Mango: ["mango"],
    Carrot: ["carrot"],
    Cabbage: ["cabbage"],
    Spinach: ["spinach", "palak"],
    Brinjal: ["brinjal", "eggplant"],
    Apple: ["apple"],
    Papaya: ["papaya"],
    Guava: ["guava"],
    Maize: ["maize", "corn"],
    "Okra (Bhindi)": ["bhindi", "okra", "lady finger"],
    "Green Peas": ["peas wet", "green peas", "peas"],
    Pomegranate: ["pomegranate", "anar"],
    Capsicum: ["capsicum", "bell pepper"],
    Lemon: ["lemon"],
    "Ginger (Green)": ["ginger", "green ginger"],
  };
}

function computeAvgPriceFromRecords(records) {
  const prices = records
    .map((r) => parseFloat(r.modal_price))
    .filter((p) => !Number.isNaN(p) && p > 0)
    .map((p) => p / 100);

  if (prices.length === 0) return null;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return Math.round(avg * 10) / 10;
}

function mapRecordsToCropPrices(records, fetchMode) {
  const aliasMap = buildAliasMap();
  const normalizedRecords = records.map((row) => ({
    ...row,
    _commodityNorm: normalizeCommodityName(row.commodity),
  }));
  const results = {};

  for (const commodity of Object.keys(CROP_MAP)) {
    const aliases = aliasMap[commodity] || [API_COMMODITY_MAP[commodity] || commodity];
    const aliasNorms = aliases.map(normalizeCommodityName);
    const matched = normalizedRecords.filter((row) => {
      return aliasNorms.some((a) => row._commodityNorm.includes(a) || a.includes(row._commodityNorm));
    });

    if (matched.length === 0) continue;

    const price = computeAvgPriceFromRecords(matched);
    if (price === null) continue;

    results[commodity] = { price, fetchMode };
  }

  return results;
}

async function fetchAllCropPrices() {
  try {
    // Use all-states data as primary source because state-filtered endpoint may be sparse.
    const allStateRecords = await fetchDataGovRecords({}, 5000);
    const allStateMapped = mapRecordsToCropPrices(allStateRecords, "all-states-bulk");
    if (Object.keys(allStateMapped).length > 0) {
      return allStateMapped;
    }

    // Fallback to Karnataka-only in case all-states query is temporarily inconsistent.
    const karnatakaRecords = await fetchDataGovRecords({ state: "Karnataka" }, 5000);
    return mapRecordsToCropPrices(karnatakaRecords, "state-bulk-fallback");
  } catch (err) {
    console.error("API ERROR:", err.message);
    return {};
  }
}

async function upsertRealPrices(realPrices, dateStr) {
  let updatedCount = 0;

  for (const [commodity, payload] of Object.entries(realPrices)) {
    const price = payload.price;
    const meta = CROP_MAP[commodity];
    const displayName = meta.displayName || commodity;

    let doc = await MarketPrice.findOne({ name: displayName });

    if (doc) {
      doc.previousPrice = doc.currentPrice ?? price;
      doc.currentPrice = price;

      const alreadyAddedToday = doc.history.some((h) => h.date === dateStr);
      if (!alreadyAddedToday) {
        doc.history.push({ price, date: dateStr });
      }

      if (doc.history.length > 30) doc.history.shift();
      doc.lastUpdated = dateStr;
      doc.dataSource = "real";
      await doc.save();
    } else {
      await MarketPrice.create({
        name: displayName,
        icon: meta.icon,
        category: meta.category,
        unit: "kg",
        currentPrice: price,
        previousPrice: price,
        history: [{ price, date: dateStr }],
        dataSource: "real",
        lastUpdated: dateStr,
      });
    }

    updatedCount += 1;
  }

  return updatedCount;
}

async function seedMissingDummyData(dateStr) {
  let createdCount = 0;

  for (const [commodity, meta] of Object.entries(CROP_MAP)) {
    const displayName = meta.displayName || commodity;
    const dummyPrice = getDummyPrice(displayName, dateStr);

    let doc = await MarketPrice.findOne({ name: displayName });

    if (!doc) {
      await MarketPrice.create({
        name: displayName,
        icon: meta.icon,
        category: meta.category,
        unit: "kg",
        currentPrice: dummyPrice,
        previousPrice: dummyPrice,
        history: [{ price: dummyPrice, date: dateStr }],
        dataSource: "simulated",
        lastUpdated: dateStr,
      });
      createdCount += 1;
    }
  }

  return createdCount;
}

async function ensureMarketPrices({ forceRefresh = false } = {}) {
  const dateStr = todayStr();
  const totalDocs = await MarketPrice.countDocuments({});
  await MarketPrice.updateMany(
    { dataSource: { $exists: false } },
    { $set: { dataSource: "simulated" } }
  );
  const realDocs = await MarketPrice.countDocuments({ dataSource: "real" });

  // Low usage path: use cache. But if DB has only simulated data, periodically retry real fetch.
  if (!forceRefresh && totalDocs > 0 && realDocs > 0) {
    return { source: "database-cache", apiUsed: false, realUpdated: 0, dummyUsed: false };
  }

  if (!forceRefresh && totalDocs > 0 && realDocs === 0) {
    const now = Date.now();
    if (now - lastAutoRealAttemptAt < AUTO_REAL_RETRY_MS) {
      return { source: "database-cache (simulated)", apiUsed: false, realUpdated: 0, dummyUsed: true };
    }
    lastAutoRealAttemptAt = now;
  }

  const realPrices = await fetchAllCropPrices();
  const realCount = Object.keys(realPrices).length;

  if (realCount > 0) {
    const realUpdated = await upsertRealPrices(realPrices, dateStr);
    await seedMissingDummyData(dateStr);

    return {
      source: "data.gov.in + database",
      apiUsed: true,
      realUpdated,
      dummyUsed: realUpdated < Object.keys(CROP_MAP).length,
    };
  }

  // API had no usable data: if DB empty, seed simulated; otherwise keep DB as-is.
  if (totalDocs === 0) {
    await seedMissingDummyData(dateStr);
    return {
      source: "dummy-data (seeded)",
      apiUsed: true,
      realUpdated: 0,
      dummyUsed: true,
    };
  }

  return {
    source: "database-cache (api-empty)",
    apiUsed: true,
    realUpdated: 0,
    dummyUsed: false,
  };
}

/* GET /api/market/prices */
router.get("/prices", async (req, res) => {
  try {
    const refreshInfo = await ensureMarketPrices({ forceRefresh: false });

    const { category, search, realOnly } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    if (String(realOnly) === "true") filter.dataSource = "real";

    const allPrices = await MarketPrice.find(filter).lean();

    const prices = allPrices.map((item) => {
      const change = (item.currentPrice || 0) - (item.previousPrice || 0);
      const changePercent = item.previousPrice
        ? ((change / item.previousPrice) * 100).toFixed(1)
        : 0;

      return {
        id: item._id,
        name: item.name,
        icon: item.icon,
        category: item.category,
        price: item.currentPrice,
        unit: item.unit,
        dataSource: item.dataSource || "simulated",
        change: Number(change.toFixed(1)),
        changePercent: Number(changePercent),
        history: (item.history || []).slice(-7),
      };
    });

    res.json({
      success: true,
      prices,
      date: todayStr(),
      source: refreshInfo.source,
      meta: {
        apiUsed: refreshInfo.apiUsed,
        realUpdated: refreshInfo.realUpdated,
        dummyUsed: refreshInfo.dummyUsed,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* POST /api/market/refresh */
router.post("/refresh", async (req, res) => {
  try {
    const refreshInfo = await ensureMarketPrices({ forceRefresh: true });

    const strictReal = String(req.query.strictReal || req.body?.strictReal || "false") === "true";
    if (strictReal && refreshInfo.realUpdated === 0) {
      return res.status(502).json({
        success: false,
        error: "No real mandi data returned by API for configured commodities right now.",
        source: refreshInfo.source,
        meta: refreshInfo,
      });
    }

    res.json({
      success: true,
      message: "Prices refreshed",
      source: refreshInfo.source,
      meta: {
        apiUsed: refreshInfo.apiUsed,
        realUpdated: refreshInfo.realUpdated,
        dummyUsed: refreshInfo.dummyUsed,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
