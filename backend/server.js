const express = require("express");
const cors = require("cors");
require("dotenv").config({ override: true });

const app = express();
const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");
const userRoutes = require("./routes/userRoutes");
const plantRoutes = require("./routes/plants");
const productRoutes = require("./routes/productRoutes");
const marketRoutes = require("./routes/marketRoutes");
const orderRoutes = require("./routes/orderRoutes");


app.use(cors());
app.use(express.json({ limit: "50mb" }));



app.use("/api/auth",authRoutes);
app.use("/api/crop", cropRoutes);
app.use("/api/user", userRoutes);
app.use("/api/plants",plantRoutes);
app.use("/api/products",productRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/orders", orderRoutes);


const connectDB = require("./config/db");
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
