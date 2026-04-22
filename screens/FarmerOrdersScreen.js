import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_CONFIG = {
  pending: { label: "New", color: "#ff9800", icon: "time-outline", bg: "#fff3e0" },
  accepted: { label: "Accepted", color: "#2196f3", icon: "checkmark-circle-outline", bg: "#e3f2fd" },
  preparing: { label: "Preparing", color: "#9c27b0", icon: "restaurant-outline", bg: "#f3e5f5" },
  ready: { label: "Ready", color: "#4caf50", icon: "bag-check-outline", bg: "#e8f5e9" },
  picked_up: { label: "Picked Up", color: "#607d8b", icon: "bicycle-outline", bg: "#eceff1" },
  cancelled: { label: "Cancelled", color: "#e53935", icon: "close-circle-outline", bg: "#ffebee" }
};

const NEXT_STATUS = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up"
};

const NEXT_LABEL = {
  pending: "Accept Order",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Picked Up"
};

export default function FarmerOrdersScreen({ navigation }) {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    const token = await getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/farmer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      console.log("Fetch orders error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    const token = await getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        Alert.alert("Error", data.message || "Failed to update");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update order");
    }
  };

  const cancelOrder = (orderId) => {
    Alert.alert("Cancel Order", "Are you sure? Stock will be restored.", [
      { text: "No", style: "cancel" },
      { text: "Yes, Cancel", style: "destructive", onPress: () => updateStatus(orderId, "cancelled") }
    ]);
  };

  const activeOrders = orders.filter(o => !["picked_up", "cancelled"].includes(o.status));
  const pastOrders = orders.filter(o => ["picked_up", "cancelled"].includes(o.status));
  const displayOrders = activeTab === "active" ? activeOrders : pastOrders;

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCountText}>{activeOrders.length}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>
            Past ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={["#2e7d32"]} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={50} color="#ddd" />
            <Text style={styles.emptyTitle}>
              {activeTab === "active" ? "No active orders" : "No past orders"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "active" ? "New orders from customers will appear here" : "Completed and cancelled orders show here"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const consumer = item.consumer || {};
          const customerName = `${consumer.firstName || ""} ${consumer.lastName || ""}`.trim() || "Customer";
          const nextStatus = NEXT_STATUS[item.status];
          const nextLabel = NEXT_LABEL[item.status];

          return (
            <View style={styles.orderCard}>

              {/* Order header */}
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
                  <Ionicons name={statusConf.icon} size={14} color={statusConf.color} />
                  <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                </View>
                <Text style={styles.orderTime}>{formatDate(item.createdAt)}</Text>
              </View>

              {/* Customer info */}
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{customerName}</Text>
                  {consumer.phone && <Text style={styles.customerPhone}>{consumer.phone}</Text>}
                </View>
                <Text style={styles.orderTotal}>{"\u20B9"}{item.totalAmount}</Text>
              </View>

              {/* Items */}
              <View style={styles.itemsList}>
                {item.items.map((orderItem, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyText}>{orderItem.qty}</Text>
                    </View>
                    <Text style={styles.itemName}>{orderItem.name}</Text>
                    <Text style={styles.itemPrice}>{"\u20B9"}{orderItem.price * orderItem.qty}</Text>
                  </View>
                ))}
              </View>

              {/* Action buttons */}
              {item.status !== "picked_up" && item.status !== "cancelled" && (
                <View style={styles.actionRow}>
                  {nextStatus && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#2e7d32" }]}
                      onPress={() => updateStatus(item._id, nextStatus)}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>{nextLabel}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e53935" }]}
                    onPress={() => cancelOrder(item._id)}
                  >
                    <Ionicons name="close" size={16} color="#e53935" />
                    <Text style={[styles.actionBtnText, { color: "#e53935" }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    flex: 1
  },
  orderCountBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  orderCountText: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 14
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 2
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  tabActive: {
    borderBottomColor: "#2e7d32"
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999"
  },
  tabTextActive: {
    color: "#2e7d32"
  },

  emptyBox: {
    alignItems: "center",
    paddingTop: 80
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#aaa",
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 13,
    color: "#ccc",
    marginTop: 6,
    textAlign: "center"
  },

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold"
  },
  orderTime: {
    fontSize: 12,
    color: "#aaa"
  },

  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14
  },
  customerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  customerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333"
  },
  customerPhone: {
    fontSize: 12,
    color: "#999",
    marginTop: 1
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32"
  },

  itemsList: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6
  },
  itemQtyBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  itemQtyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e7d32"
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#555"
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333"
  },

  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff"
  }
});
