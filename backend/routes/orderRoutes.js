const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// ============================================
// CONSUMER: Place order
// ============================================
router.post("/place", authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Group items by farmer
    const farmerGroups = {};
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const farmerId = product.farmer.toString();
      if (!farmerGroups[farmerId]) {
        farmerGroups[farmerId] = [];
      }

      // Check stock
      if (product.quantity < item.qty) {
        return res.status(400).json({
          message: `"${product.name}" only has ${product.quantity} ${product.unit} in stock`
        });
      }

      farmerGroups[farmerId].push({
        product: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        qty: item.qty,
        image: product.image
      });
    }

    const orders = [];

    // Create one order per farmer & reduce stock
    for (const [farmerId, orderItems] of Object.entries(farmerGroups)) {
      const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

      const order = await Order.create({
        consumer: req.user.id,
        farmer: farmerId,
        items: orderItems,
        totalAmount,
        deliveryAddress: deliveryAddress || {},
        note: note || ""
      });

      // Reduce stock for each product
      for (const item of orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity = Math.max(0, product.quantity - item.qty);
          if (product.quantity === 0) {
            product.stock = "out_of_stock";
          } else if (product.quantity <= 5) {
            product.stock = "limited";
          }
          await product.save();
        }
      }

      orders.push(order);
    }

    res.json({ success: true, orders });
  } catch (err) {
    console.log("Place order error:", err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

// ============================================
// CONSUMER: My orders
// ============================================
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ consumer: req.user.id })
      .populate("farmer", "firstName lastName phone farmName")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ============================================
// FARMER: Orders received
// ============================================
router.get("/farmer", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user.id })
      .populate("consumer", "firstName lastName phone address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ============================================
// FARMER: Update order status
// ============================================
router.put("/status/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({ _id: req.params.id, farmer: req.user.id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If cancelling, restore stock
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.quantity += item.qty;
          if (product.quantity > 5) {
            product.stock = "available";
          } else if (product.quantity > 0) {
            product.stock = "limited";
          }
          await product.save();
        }
      }
    }

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update order" });
  }
});

module.exports = router;
