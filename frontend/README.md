# 🌱 AgroAssist — Frontend (Mobile App)

React Native + Expo mobile application for AgroAssist. Contains both the **Farmer** and **Consumer** role flows in a single app.

> For the full project overview, see the [root README](../README.md).

---

## 🛠️ Tech Stack

- **React Native** 0.83
- **Expo** SDK 55
- **React Navigation** (Native Stack + Bottom Tabs)
- **React Context** for cart and auth state
- **Lottie** for animations
- **react-native-chart-kit** + **react-native-svg** for growth curves
- **AsyncStorage** for JWT token persistence
- **expo-location** for GPS capture

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (or Android/iOS emulator)
- A running instance of the [backend](../backend/README.md)

### Install
```bash
cd frontend
npm install
```

### Configure
Copy `.env.example` to `.env` and set your backend URL:
```bash
cp .env.example .env
```

> ⚠️ Use your machine's LAN IP (e.g. `192.168.1.5`), **not** `localhost`, so Expo Go on a physical device can reach the backend.

### Run
```bash
npx expo start
```

Scan the QR code with:
- **Android** — Expo Go app
- **iOS** — Camera app

---

## 📁 Structure

```
frontend/
├── App.js                  # Root component
├── app.json                # Expo config
├── assets/                 # Images, icons, Lottie files, screenshots
├── components/             # Reusable UI components
├── constants/
│   └── cropCycles.js       # Single source of truth for crop data
├── context/                # Cart + Auth contexts
├── navigation/             # Stack + Tab navigators
├── screens/                # All feature screens
│   ├── LoginScreen.js
│   ├── OtpScreen.js
│   ├── DashboardScreen.js
│   ├── MyPlantsScreen.js
│   ├── GrowthTrackerScreen.js
│   ├── AddPlantScreen.js
│   ├── CropRecommendationScreen.js
│   ├── CropInsightScreen.js
│   ├── MarketplaceScreen.js           # Farmer
│   ├── FarmerOrdersScreen.js
│   ├── ConsumerMarketplaceScreen.js
│   ├── FarmDetailScreen.js
│   ├── CartScreen.js
│   ├── DeliveryConfirmScreen.js
│   ├── ConsumerOrdersScreen.js
│   ├── FarmProfileScreen.js
│   └── ProfileScreen.js
└── services/               # API clients + auth storage
```

---

## 🧭 User Flows

**Farmer:** Login → OTP → Role → Dashboard → (My Plants / Crop Recommendation / Marketplace / Orders / Profile)

**Consumer:** Login → OTP → Role → Browse Farms → Cart → Delivery → Orders
