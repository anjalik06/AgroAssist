import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CartContext } from "../context/CartContext";

const { width } = Dimensions.get("window");

const productPlaceholders = {
  vegetables: "https://images.unsplash.com/photo-1566385101042-1a0aa4c1c900?w=200&h=200&fit=crop",
  fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop",
  grains: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop",
  dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop",
  other: "https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=200&h=200&fit=crop"
};

export default function CartScreen({ navigation }) {

  const { cart, increaseQty, decreaseQty, clearCart } = useContext(CartContext);

  const getItemPrice = (item) => {
    if (item.numericPrice) return item.numericPrice;
    return parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemPrice(item) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Group by farm
  const farmGroups = {};
  cart.forEach(item => {
    const farm = item.farmName || "Farm";
    if (!farmGroups[farm]) farmGroups[farm] = [];
    farmGroups[farm].push(item);
  });
  const farmNames = Object.keys(farmGroups);

  const getImage = (item) => {
    if (item.image && item.image.length > 5) return item.image;
    return productPlaceholders[item.category] || productPlaceholders.other;
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={50} color="#ccc" />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Browse farms and add fresh produce to get started</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="storefront-outline" size={18} color="#fff" />
          <Text style={styles.browseBtnText}>Browse Farms</Text>
        </TouchableOpacity>
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
        <View>
          <Text style={styles.headerTitle}>Cart</Text>
          <Text style={styles.headerSubtitle}>{itemCount} item{itemCount > 1 ? "s" : ""} from {farmNames.length} farm{farmNames.length > 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        ListHeaderComponent={() => (
          <>
            {/* Delivery banner */}
            <View style={styles.deliveryBanner}>
              <Ionicons name="bicycle-outline" size={20} color="#2e7d32" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.deliveryTitle}>Farm Fresh Delivery</Text>
                <Text style={styles.deliverySubtext}>Direct from farmer to your doorstep</Text>
              </View>
              <View style={styles.freeTag}>
                <Text style={styles.freeTagText}>FREE</Text>
              </View>
            </View>

            {/* Farm name header if single farm */}
            {farmNames.length === 1 && (
              <View style={styles.farmHeader}>
                <Ionicons name="storefront" size={16} color="#2e7d32" />
                <Text style={styles.farmHeaderText}>{farmNames[0]}</Text>
              </View>
            )}
          </>
        )}
        renderItem={({ item, index }) => (
          <View style={styles.itemCard}>
            <Image source={{ uri: getImage(item) }} style={styles.itemImage} />

            <View style={styles.itemDetails}>
              <View style={[styles.vegIndicator, { borderColor: item.category === "vegetables" || item.category === "grains" ? "#4caf50" : "#e53935" }]}>
                <View style={[styles.vegDot, { backgroundColor: item.category === "vegetables" || item.category === "grains" ? "#4caf50" : "#e53935" }]} />
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>{"\u20B9"}{getItemPrice(item)}/{item.unit || "kg"}</Text>
              {farmNames.length > 1 && item.farmName && (
                <Text style={styles.itemFarm}>{item.farmName}</Text>
              )}
            </View>

            <View style={styles.itemRight}>
              <View style={styles.qtyBox}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
                  <Ionicons name={item.qty === 1 ? "trash-outline" : "remove"} size={14} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
                  <Ionicons name="add" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemTotal}>{"\u20B9"}{getItemPrice(item) * item.qty}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.billCard}>
            <Text style={styles.billTitle}>Bill Details</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>{"\u20B9"}{subtotal}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={[styles.billValue, { color: "#2e7d32" }]}>FREE</Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billRow}>
              <Text style={styles.billTotal}>To Pay</Text>
              <Text style={styles.billTotal}>{"\u20B9"}{subtotal}</Text>
            </View>

            <View style={styles.savingsBadge}>
              <Ionicons name="leaf" size={14} color="#2e7d32" />
              <Text style={styles.savingsText}>You're supporting local farmers with this order!</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom checkout bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomTotal}>{"\u20B9"}{subtotal}</Text>
          <Text style={styles.bottomItems}>{itemCount} item{itemCount > 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("DeliveryConfirm")}
        >
          <Text style={styles.checkoutText}>Place Order</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 40
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8
  },
  browseBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15
  },

  // Header
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#222"
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 1
  },
  clearBtn: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fff3e0"
  },
  clearText: {
    color: "#e65100",
    fontSize: 13,
    fontWeight: "600"
  },

  // Delivery banner
  deliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32"
  },
  deliverySubtext: {
    fontSize: 11,
    color: "#66bb6a",
    marginTop: 1
  },
  freeTag: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  freeTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold"
  },

  // Farm header
  farmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingLeft: 4
  },
  farmHeaderText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333"
  },

  // Item card
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#f0f0f0"
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333"
  },
  itemPrice: {
    fontSize: 13,
    color: "#888",
    marginTop: 2
  },
  itemFarm: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 2
  },
  itemRight: {
    alignItems: "center",
    marginLeft: 8
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    overflow: "hidden"
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  qtyText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    minWidth: 20,
    textAlign: "center"
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 6
  },

  // Bill card
  billCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 8
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 14
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  billLabel: {
    fontSize: 14,
    color: "#888"
  },
  billValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500"
  },
  billDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10
  },
  billTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222"
  },
  savingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6
  },
  savingsText: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "500",
    flex: 1
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 }
  },
  bottomLeft: {},
  bottomTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222"
  },
  bottomItems: {
    fontSize: 12,
    color: "#999",
    marginTop: 1
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});
