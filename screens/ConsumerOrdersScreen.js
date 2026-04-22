import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";

const STATUS_FLOW = ["pending", "accepted", "preparing", "ready", "picked_up"];

const STATUS_CONFIG = {
  pending:    { label: "Waiting for farmer",  color: "#ff9800", icon: "time-outline" },
  accepted:   { label: "Accepted",             color: "#2196f3", icon: "checkmark-circle-outline" },
  preparing:  { label: "Preparing",            color: "#9c27b0", icon: "leaf-outline" },
  ready:      { label: "Ready for pickup",     color: "#00bcd4", icon: "cube-outline" },
  picked_up:  { label: "Picked up",            color: "#4caf50", icon: "checkmark-done-outline" },
  cancelled:  { label: "Cancelled",            color: "#e53935", icon: "close-circle-outline" }
};

export default function ConsumerOrdersScreen({ navigation }) {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("active");

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.log("Fetch orders error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const activeOrders = orders.filter(o => !["picked_up", "cancelled"].includes(o.status));
  const pastOrders = orders.filter(o => ["picked_up", "cancelled"].includes(o.status));
  const displayOrders = tab === "active" ? activeOrders : pastOrders;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track your fresh produce</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "active" && styles.tabActive]}
          onPress={() => setTab("active")}
        >
          <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "past" && styles.tabActive]}
          onPress={() => setTab("past")}
        >
          <Text style={[styles.tabText, tab === "past" && styles.tabTextActive]}>
            Past ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
        }
      >
        {displayOrders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {tab === "active" ? "No active orders" : "No past orders"}
            </Text>
            <Text style={styles.emptyText}>
              {tab === "active"
                ? "Browse the marketplace to order fresh produce"
                : "Your completed orders will appear here"}
            </Text>
            {tab === "active" && (
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => navigation.navigate("Shop")}
              >
                <Ionicons name="storefront-outline" size={18} color="#fff" />
                <Text style={styles.shopBtnText}>Shop Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isCancelled = order.status === "cancelled";
            const currentIdx = STATUS_FLOW.indexOf(order.status);

            return (
              <View key={order._id} style={styles.orderCard}>

                <View style={styles.cardHeader}>
                  <View style={styles.farmInfo}>
                    <Ionicons name="leaf" size={16} color="#2e7d32" />
                    <Text style={styles.farmName}>
                      {order.farmer?.farmName || order.farmer?.name || "Farm"}
                    </Text>
                  </View>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: cfg.color + "15" }]}>
                  <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>

                {!isCancelled && (
                  <View style={styles.timeline}>
                    {STATUS_FLOW.map((s, idx) => {
                      const reached = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <View key={s} style={styles.timelineItem}>
                          <View
                            style={[
                              styles.timelineDot,
                              reached && styles.timelineDotActive,
                              isCurrent && styles.timelineDotCurrent
                            ]}
                          />
                          {idx < STATUS_FLOW.length - 1 && (
                            <View
                              style={[
                                styles.timelineLine,
                                idx < currentIdx && styles.timelineLineActive
                              ]}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.itemsBox}>
                  {order.items.map((item, i) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{item.qty}x</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{"\u20B9"}{item.price * item.qty}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{"\u20B9"}{order.totalAmount}</Text>
                </View>

              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5"
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14
  },

  header: {
    backgroundColor: "#2e7d32",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff"
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#c8e6c9",
    marginTop: 2
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f5f5f5"
  },
  tabActive: {
    backgroundColor: "#2e7d32"
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666"
  },
  tabTextActive: {
    color: "#fff"
  },

  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30
  },

  emptyBox: {
    alignItems: "center",
    paddingTop: 60
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 20
  },
  shopBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14
  },

  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  farmInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  farmName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333"
  },
  orderDate: {
    fontSize: 11,
    color: "#999"
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold"
  },

  timeline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 14
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e0e0e0"
  },
  timelineDotActive: {
    backgroundColor: "#2e7d32"
  },
  timelineDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ff9800",
    borderWidth: 2,
    borderColor: "#fff3e0"
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 2
  },
  timelineLineActive: {
    backgroundColor: "#2e7d32"
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10
  },

  itemsBox: {
    gap: 4
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  itemQty: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2e7d32",
    width: 28
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#555"
  },
  itemPrice: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500"
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500"
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32"
  }
});
