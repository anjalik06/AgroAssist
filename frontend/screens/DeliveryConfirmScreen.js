import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from "react-native";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { CartContext } from "../context/CartContext";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";

export default function DeliveryConfirmScreen({ navigation }) {

  const { cart, clearCart } = useContext(CartContext);
  const [placing, setPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const getItemPrice = (item) => {
    if (item.numericPrice) return item.numericPrice;
    return parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
  };

  const total = cart.reduce((sum, item) => sum + getItemPrice(item) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Group by farm
  const farmGroups = {};
  cart.forEach(item => {
    const farm = item.farmName || "Farm";
    if (!farmGroups[farm]) farmGroups[farm] = [];
    farmGroups[farm].push(item);
  });

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    setError("");

    try {
      const token = await getToken();
      const items = cart.map(item => ({
        productId: item.id,
        qty: item.qty
      }));

      const response = await fetch(`${API_BASE_URL}/api/orders/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setOrderPlaced(true);
        clearCart();
      } else {
        setError(data.message || "Failed to place order");
      }
    } catch (err) {
      console.log("Order error:", err);
      setError("Something went wrong. Please try again.");
    }
    setPlacing(false);
  };

  useEffect(() => {
    if (cart.length > 0 && !orderPlaced) {
      placeOrder();
    }
  }, []);

  // Order placed success view
  if (orderPlaced) {
    return (
      <View style={styles.successContainer}>
        <LottieView
          source={require("../assets/animations/delivery.json")}
          autoPlay
          loop={false}
          style={styles.animation}
        />

        <Text style={styles.successTitle}>Order Placed!</Text>
        <Text style={styles.successSubtitle}>Your fresh produce is being prepared</Text>

        {orders.map((order, idx) => (
          <View key={order._id || idx} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={[styles.statusDot, { backgroundColor: "#4caf50" }]} />
              <Text style={styles.orderStatus}>Order Confirmed</Text>
              <Text style={styles.orderAmount}>{"\u20B9"}{order.totalAmount}</Text>
            </View>

            <View style={styles.orderDivider} />

            {order.items.map((item, i) => (
              <View key={i} style={styles.orderItem}>
                <Text style={styles.orderItemQty}>{item.qty}x</Text>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemPrice}>{"\u20B9"}{item.price * item.qty}</Text>
              </View>
            ))}

            <View style={styles.orderFooter}>
              <Ionicons name="time-outline" size={14} color="#888" />
              <Text style={styles.orderFooterText}>Farmer will accept your order soon</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Placing order / error view
  return (
    <View style={styles.container}>
      {placing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Placing your order...</Text>
          <Text style={styles.loadingSubtext}>Reserving items from the farmer</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={50} color="#e53935" />
          <Text style={styles.errorTitle}>Order Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={placeOrder}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backLinkText}>Go back to cart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Preparing your order...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  // Success
  successContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20
  },
  animation: {
    width: 180,
    height: 180
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2e7d32",
    marginTop: 10
  },
  successSubtitle: {
    color: "#666",
    fontSize: 14,
    marginBottom: 24
  },

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    marginBottom: 12
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  orderStatus: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#333"
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32"
  },
  orderDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  orderItemQty: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32",
    width: 30
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: "#555"
  },
  orderItemPrice: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500"
  },
  orderFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
    backgroundColor: "#fff8e1",
    padding: 10,
    borderRadius: 8
  },
  orderFooterText: {
    fontSize: 12,
    color: "#888"
  },

  homeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 16
  },
  homeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },

  // Loading
  loadingBox: {
    alignItems: "center"
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16
  },
  loadingSubtext: {
    fontSize: 13,
    color: "#999",
    marginTop: 4
  },

  // Error
  errorBox: {
    alignItems: "center"
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e53935",
    marginTop: 12
  },
  errorText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15
  },
  backLink: {
    marginTop: 16
  },
  backLinkText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "600"
  }
});
