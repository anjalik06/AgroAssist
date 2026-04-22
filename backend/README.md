# 🌱 AgroAssist — Backend (API Server)

Node.js + Express REST API server for AgroAssist. Handles authentication, AI recommendations, plant tracking, and the marketplace.

> For the full project overview, see the [root README](../README.md).

---

## 🛠️ Tech Stack

- **Node.js** + **Express.js 5**
- **MongoDB** + **Mongoose** ODM
- **JWT** for session tokens
- **Twilio** SMS for OTP delivery
- **Google Gemini 2.5 Flash** (`@google/generative-ai`) for crop recommendations and market insights
- **bcryptjs** for password hashing (where applicable)
- **otp-generator** for one-time codes

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally or a cloud MongoDB URI
- Twilio account (free trial works)
- Google Gemini API key — https://ai.google.dev/

### Install
```bash
cd backend
npm install
```

### Configure
Copy `.env.example` to `.env` and fill in real credentials:
```bash
cp .env.example .env
```

### Run
```bash
npm start
```

The server listens on `http://localhost:5000` by default.

---

## 🔑 Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Verified Twilio phone number |
| `GEMINI_API_KEY` | Google Gemini API key |
| `PORT` | Server port (default `5000`) |

---

## 📁 Structure

```
backend/
├── server.js           # Express app entry point
├── config/
│   ├── db.js           # MongoDB connection
│   └── gemini.js       # Gemini client setup
├── middleware/
│   └── authMiddleware.js   # JWT verification
├── models/
│   ├── User.js
│   ├── Plant.js
│   ├── Product.js
│   ├── Order.js
│   ├── Recommendation.js
│   ├── CropInsight.js
│   └── MarketPrice.js
├── controllers/        # Request handlers
└── routes/
    ├── authRoutes.js   # OTP + JWT
    ├── userRoutes.js   # Profile
    ├── plants.js       # Growth tracker CRUD
    ├── cropRoutes.js   # Gemini recommendation + insight
    ├── productRoutes.js
    └── orderRoutes.js
```

---

## 📡 API Endpoints

### Auth
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/auth/send-otp` | `{ phone }` | `{ success }` |
| POST | `/api/auth/verify-otp` | `{ phone, otp }` | `{ token, user }` |

### User
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/profile` | Current user |
| PATCH | `/api/user/profile` | Update user profile |

### Plants (Growth Tracker)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/plants/add` | Add a plant |
| GET | `/api/plants/all` | List user's plants |
| PATCH | `/api/plants/:id` | Update plant (e.g. `overriddenStage`) |
| DELETE | `/api/plants/:id` | Delete plant |
| POST | `/api/plants/seed-demo` | Seed demo crops for current user |

### Crops (AI)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/crops/recommend` | GPS → ranked crops (Gemini, cached) |
| POST | `/api/crops/insight` | Market insight for one crop |

### Products (Marketplace)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/products` | List all active products |
| POST | `/api/products` | Add product (farmer) |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Remove product |

### Orders
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/orders` | Place order (consumer) |
| GET | `/api/orders/my` | My orders (consumer) |
| GET | `/api/orders/farmer` | Incoming orders (farmer) |
| PATCH | `/api/orders/:id/status` | Update order status |

---

## 🧠 Gemini Recommendation Flow

1. Client sends `{ latitude, longitude }`.
2. Coords rounded to 3 decimals (≈100 m precision).
3. Check `Recommendation` collection for today's cached entry.
4. **Cache hit** → return immediately.
5. **Cache miss** → single structured prompt to Gemini 2.5 Flash returning:
   - Location, season, soil type, weather
   - Top 5 crops ranked by `trending_score`
   - 5-year price history, profit potential, risks, benefits
6. Save to `Recommendation` + `CropInsight` collections.
7. Return to client.

If Gemini fails, fallback to the most recent cached entry for the same coordinates.
