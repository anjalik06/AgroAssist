import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

function getProductImage(product) {
  if (product.image && product.image.length > 0) {
    if (product.image.startsWith("data:")) return product.image;
    if (product.image.startsWith("http")) return product.image;
    return `data:image/jpeg;base64,${product.image}`;
  }
  return productPlaceholders[product.category] || productPlaceholders.other;
}

export default function FarmDetailScreen({ navigation, route }) {

  const { farm } = route.params;
  const { cart, addToCart, increaseQty, decreaseQty } = useContext(CartContext);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.numericPrice || parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
    return sum + price * item.qty;
  }, 0);

  // Check which categories this farm has
  const hasVegetables = farm.products.some(p => p.category === "vegetables");
  const hasFruits = farm.products.some(p => p.category === "fruits");
  const hasGrains = farm.products.some(p => p.category === "grains");
  const hasDairy = farm.products.some(p => p.category === "dairy");

  // Filter products based on selected category — only show available stock
  const availableProducts = farm.products.filter(p => p.stock !== "out_of_stock");
  const filteredProducts = selectedFilter === "all"
    ? availableProducts
    : availableProducts.filter(p => p.category === selectedFilter);

  const vegetableCount = availableProducts.filter(p => p.category === "vegetables").length;
  const fruitCount = availableProducts.filter(p => p.category === "fruits").length;

  const renderStars = (rating) => {
    const stars = [];
    const r = parseFloat(rating) || 4.5;
    const full = Math.floor(r);
    for (let i = 0; i < full; i++) {
      stars.push(<Ionicons key={`f${i}`} name="star" size={13} color="#ffc107" />);
    }
    if (r % 1 >= 0.5) {
      stars.push(<Ionicons key="h" name="star-half" size={13} color="#ffc107" />);
    }
    return stars;
  };

  return (

    <View style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* FARM COVER IMAGE */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: farm.image }} style={styles.coverImage} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>

          {/* Cart Button */}
          <TouchableOpacity
            style={styles.headerCartBtn}
            onPress={() => navigation.navigate("Home", { screen: "Cart" })}
          >
            <Ionicons name="cart-outline" size={22} color="#333" />
            {cartCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Gradient overlay at bottom */}
          <View style={styles.coverGradient} />
        </View>

        {/* FARM INFO CARD */}
        <View style={styles.farmInfoCard}>

          <View style={styles.farmNameRow}>
            <Text style={styles.farmName}>{farm.name}</Text>
            {farm.rating && (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={13} color="#fff" />
                <Text style={styles.ratingChipText}>{farm.rating}</Text>
              </View>
            )}
          </View>

          <View style={styles.tagsRow}>
            {(farm.tags || []).map((tag, idx) => (
              <Text key={idx} style={styles.tagText}>{tag}</Text>
            ))}
          </View>

          <View style={styles.farmDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={15} color="#4caf50" />
              <Text style={styles.detailText}>{farm.owner}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={15} color="#4caf50" />
              <Text style={styles.detailText}>{farm.distance || "Nearby"}</Text>
            </View>
            {farm.phone && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.detailItem}>
                  <Ionicons name="call-outline" size={15} color="#4caf50" />
                  <Text style={styles.detailText}>{farm.phone}</Text>
                </View>
              </>
            )}
          </View>

          {farm.rating && (
            <View style={styles.ratingRow}>
              {renderStars(farm.rating)}
              <Text style={styles.ratingCountText}>{farm.ratingCount || 0} ratings</Text>
            </View>
          )}

        </View>

        {/* VEG / FRUIT FILTER - Zomato style toggle */}
        <View style={styles.filterSection}>

          <View style={styles.filterRow}>

            {/* All */}
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === "all" && styles.filterChipAllActive]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text style={[styles.filterChipText, selectedFilter === "all" && styles.filterChipTextActive]}>
                All ({availableProducts.length})
              </Text>
            </TouchableOpacity>

            {/* Vegetables toggle */}
            {hasVegetables && (
              <TouchableOpacity
                style={[styles.filterChip, styles.filterChipVeg, selectedFilter === "vegetables" && styles.filterChipVegActive]}
                onPress={() => setSelectedFilter(selectedFilter === "vegetables" ? "all" : "vegetables")}
              >
                <View style={[styles.vegIcon, selectedFilter === "vegetables" && styles.vegIconActive]}>
                  <View style={styles.vegDotSmall} />
                </View>
                <Text style={[styles.filterChipText, selectedFilter === "vegetables" && styles.filterChipTextVegActive]}>
                  Veg ({vegetableCount})
                </Text>
              </TouchableOpacity>
            )}

            {/* Fruits toggle */}
            {hasFruits && (
              <TouchableOpacity
                style={[styles.filterChip, styles.filterChipFruit, selectedFilter === "fruits" && styles.filterChipFruitActive]}
                onPress={() => setSelectedFilter(selectedFilter === "fruits" ? "all" : "fruits")}
              >
                <View style={[styles.fruitIcon, selectedFilter === "fruits" && styles.fruitIconActive]}>
                  <View style={styles.fruitDotSmall} />
                </View>
                <Text style={[styles.filterChipText, selectedFilter === "fruits" && styles.filterChipTextFruitActive]}>
                  Fruits ({fruitCount})
                </Text>
              </TouchableOpacity>
            )}

          </View>

        </View>

        {/* MENU HEADER */}
        <View style={styles.menuHeader}>
          <View style={styles.menuHeaderLine} />
          <Text style={styles.menuHeaderText}>
            {selectedFilter === "all" ? "MENU" : selectedFilter.toUpperCase()}
          </Text>
          <View style={styles.menuHeaderLine} />
        </View>

        {/* PRODUCTS LIST */}
        <View style={styles.productsContainer}>
          {filteredProducts.map((item, index) => {

            const cartItem = cart.find(p => p.id === item.id);
            const qty = cartItem ? cartItem.qty : 0;
            const isVeg = item.category === "vegetables";
            const imageUri = getProductImage(item);
            const displayPrice = item.price || `\u20B9${item.numericPrice}/${item.unit || "kg"}`;
            const stockLabel = item.stock === "limited" ? "Limited Stock" : null;
            const maxQty = item.quantity || 999;
            const canAdd = qty < maxQty;

            return (
              <View key={item.id}>
                <View style={styles.productRow}>

                  {/* Product Info */}
                  <View style={styles.productDetails}>

                    {/* Veg/Fruit indicator - like Zomato */}
                    <View style={[styles.typeIndicator, { borderColor: isVeg ? "#4caf50" : "#e53935" }]}>
                      <View style={[styles.typeDot, { backgroundColor: isVeg ? "#4caf50" : "#e53935" }]} />
                    </View>

                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>{displayPrice}</Text>

                    {item.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                    ) : (
                      <Text style={styles.productDesc}>
                        Fresh {item.name.toLowerCase()} from {farm.name}
                      </Text>
                    )}

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={styles.categoryBadge}>
                        <Text style={[styles.categoryBadgeText, { color: isVeg ? "#4caf50" : "#e53935" }]}>
                          {item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Other"}
                        </Text>
                      </View>
                      {item.quantity !== undefined && (
                        <View style={[styles.categoryBadge, { backgroundColor: item.quantity === 0 ? "#ffebee" : item.quantity <= 5 ? "#fff3e0" : "#e8f5e9" }]}>
                          <Text style={[styles.categoryBadgeText, { color: item.quantity === 0 ? "#e53935" : item.quantity <= 5 ? "#e65100" : "#2e7d32" }]}>
                            {item.quantity === 0 ? "Out of Stock" : `${item.quantity} ${item.unit || "kg"} left`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Product Image + Add Button */}
                  <View style={styles.productImageContainer}>
                    <View style={styles.productImageBg}>
                      <Image source={{ uri: imageUri }} style={styles.productImage} />
                    </View>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={[styles.addBtn, !canAdd && { opacity: 0.4 }]}
                        disabled={!canAdd}
                        onPress={() => addToCart({
                          id: item.id,
                          name: item.name,
                          price: displayPrice,
                          numericPrice: item.numericPrice || parseInt(String(item.price).replace(/[^\d]/g, "")) || 0,
                          image: imageUri,
                          category: item.category,
                          unit: item.unit || "kg",
                          farmId: farm.id,
                          farmName: farm.name
                        })}
                      >
                        <Text style={styles.addBtnText}>{canAdd ? "ADD" : "OUT"}</Text>
                        {canAdd && <Text style={styles.addBtnPlus}>+</Text>}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => decreaseQty(item.id)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, !canAdd && { opacity: 0.4 }]}
                          disabled={!canAdd}
                          onPress={() => increaseQty(item.id)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                </View>

                {/* Divider */}
                {index < filteredProducts.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}

          {filteredProducts.length === 0 && (
            <View style={styles.emptyFilter}>
              <Text style={styles.emptyFilterText}>No {selectedFilter} available from this farm</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />

      </ScrollView>

      {/* BOTTOM CART BAR - Swiggy style */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          activeOpacity={0.95}
          onPress={() => navigation.navigate("Home", { screen: "Cart" })}
        >
          <View style={styles.cartBarLeft}>
            <Text style={styles.cartBarItems}>{cartCount} item{cartCount > 1 ? "s" : ""}</Text>
            <Text style={styles.cartBarTotal}>{"\u20B9"}{cartTotal}</Text>
          </View>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarBtnText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff"
  },

  // Cover image
  coverContainer: {
    position: "relative"
  },

  coverImage: {
    width: width,
    height: 220,
    resizeMode: "cover"
  },

  backBtn: {
    position: "absolute",
    top: 44,
    left: 16,
    backgroundColor: "#fff",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },

  headerCartBtn: {
    position: "absolute",
    top: 44,
    right: 16,
    backgroundColor: "#fff",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },

  headerBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#e53935",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3
  },

  headerBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold"
  },

  coverGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.6)"
  },

  // Farm info card
  farmInfoCard: {
    backgroundColor: "#fff",
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f0f0f0"
  },

  farmNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },

  farmName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    flex: 1
  },

  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4
  },

  ratingChipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold"
  },

  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6
  },

  tagText: {
    fontSize: 13,
    color: "#888"
  },

  farmDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f8faf5",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },

  detailText: {
    fontSize: 13,
    color: "#555"
  },

  detailDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e0e0e0"
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },

  ratingCountText: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 6
  },

  // Veg/Fruit filter section
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4
  },

  filterRow: {
    flexDirection: "row",
    gap: 10
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    gap: 6
  },

  filterChipAllActive: {
    backgroundColor: "#333",
    borderColor: "#333"
  },

  filterChipVeg: {
    borderColor: "#c8e6c9"
  },

  filterChipVegActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50"
  },

  filterChipFruit: {
    borderColor: "#ffcdd2"
  },

  filterChipFruitActive: {
    backgroundColor: "#fce4ec",
    borderColor: "#e53935"
  },

  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666"
  },

  filterChipTextActive: {
    color: "#fff"
  },

  filterChipTextVegActive: {
    color: "#2e7d32"
  },

  filterChipTextFruitActive: {
    color: "#c62828"
  },

  vegIcon: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#4caf50",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center"
  },

  vegIconActive: {
    borderColor: "#4caf50"
  },

  vegDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50"
  },

  fruitIcon: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#e53935",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center"
  },

  fruitIconActive: {
    borderColor: "#e53935"
  },

  fruitDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e53935"
  },

  // Menu header
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 20
  },

  menuHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee"
  },

  menuHeaderText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 2,
    marginHorizontal: 16
  },

  // Products
  productsContainer: {
    paddingHorizontal: 20
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 18
  },

  productDetails: {
    flex: 1,
    paddingRight: 14
  },

  typeIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },

  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  productName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },

  productDesc: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 17,
    marginBottom: 8
  },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#f5f5f5"
  },

  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  productImageContainer: {
    alignItems: "center",
    width: 110
  },

  productImageBg: {
    width: 110,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#f5f9f0",
    overflow: "hidden"
  },

  productImage: {
    width: 110,
    height: 90,
    resizeMode: "cover"
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#2e7d32",
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: -14,
    gap: 2
  },

  addBtnText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "bold"
  },

  addBtnPlus: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "bold"
  },

  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 10,
    marginTop: -14,
    paddingHorizontal: 4,
    paddingVertical: 2
  },

  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },

  qtyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },

  qtyValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginHorizontal: 2
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0"
  },

  emptyFilter: {
    paddingVertical: 40,
    alignItems: "center"
  },

  emptyFilterText: {
    color: "#aaa",
    fontSize: 14
  },

  // Bottom cart bar
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24
  },

  cartBarLeft: {},

  cartBarItems: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },

  cartBarTotal: {
    color: "#fff",
    fontSize: 11,
    opacity: 0.85,
    marginTop: 2
  },

  cartBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },

  cartBarBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }

});
