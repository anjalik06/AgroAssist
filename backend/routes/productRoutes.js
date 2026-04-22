const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// ============================================
// FARMER ROUTES (require auth)
// ============================================

// GET /api/products/my — farmer's own products
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// POST /api/products/add — farmer adds a product
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { name, description, price, unit, category, image, quantity } = req.body;

    const product = await Product.create({
      farmer: req.user.id,
      name,
      description,
      price,
      unit: unit || "kg",
      category: category || "vegetables",
      image: image || "",
      quantity: quantity !== undefined ? Number(quantity) : 50,
      stock: quantity !== undefined ? (Number(quantity) === 0 ? "out_of_stock" : Number(quantity) <= 5 ? "limited" : "available") : "available"
    });

    res.json({ success: true, product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

// PUT /api/products/update/:id — farmer updates a product
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, price, unit, category, image, stock, isActive, quantity } = req.body;

    const product = await Product.findOne({ _id: req.params.id, farmer: req.user.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (unit !== undefined) product.unit = unit;
    if (category !== undefined) product.category = category;
    if (image !== undefined) product.image = image;
    if (isActive !== undefined) product.isActive = isActive;

    if (quantity !== undefined) {
      product.quantity = Number(quantity);
      product.stock = Number(quantity) === 0 ? "out_of_stock" : Number(quantity) <= 5 ? "limited" : "available";
    } else if (stock !== undefined) {
      product.stock = stock;
    }

    await product.save();

    res.json({ success: true, product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update product" });
  }
});

// DELETE /api/products/delete/:id — farmer deletes a product
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, farmer: req.user.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// ============================================
// CONSUMER ROUTES (public)
// ============================================

// GET /api/products/all — all active products (with farmer info)
router.get("/all", async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = { isActive: true };
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(filter)
      .populate("farmer", "firstName lastName phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// GET /api/products/farms — grouped by farmer (for consumer farm view)
router.get("/farms", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate("farmer", "firstName lastName phone address")
      .sort({ createdAt: -1 });

    // Group products by farmer
    const farmMap = {};

    products.forEach(product => {
      if (!product.farmer) return;
      const farmerId = product.farmer._id.toString();

      if (!farmMap[farmerId]) {
        const farmer = product.farmer;
        farmMap[farmerId] = {
          id: farmerId,
          name: `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() || "Farm",
          owner: `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() || "Farmer",
          phone: farmer.phone,
          products: []
        };
      }

      farmMap[farmerId].products.push({
        id: product._id,
        name: product.name,
        price: `₹${product.price}/${product.unit}`,
        numericPrice: product.price,
        unit: product.unit,
        category: product.category,
        image: product.image,
        description: product.description,
        stock: product.stock,
        quantity: product.quantity || 0
      });
    });

    const farms = Object.values(farmMap);

    res.json({ success: true, farms });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch farms" });
  }
});

module.exports = router;
