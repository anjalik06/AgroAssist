const { GoogleGenerativeAI } = require("@google/generative-ai");

const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const apiKey = rawApiKey.trim();

if (!apiKey) {
  throw new Error("Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY) in .env");
}

const genAI = new GoogleGenerativeAI(apiKey);

module.exports = genAI;
