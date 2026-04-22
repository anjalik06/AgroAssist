import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CartContext } from "../context/CartContext";
import { API_BASE_URL } from "@env";

const { width } = Dimensions.get("window");

const banners = [
  {
    id: 1,
    title: "Farm Fresh Produce",
    subtitle: "Direct from farmers near you",
    bg: "#4caf50",
    emoji: "\u{1F69C}"
  },
  {
    id: 2,
    title: "Organic & Natural",
    subtitle: "100% chemical-free produce",
    bg: "#ff9800",
    emoji: "\u{1F33F}"
  },
  {
    id: 3,
    title: "Seasonal Harvest",
    subtitle: "Best deals this season",
    bg: "#2196f3",
    emoji: "\u{1F33E}"
  }
];

const categories = [
  { key: "all", label: "All", icon: "grid-outline" },
  { key: "vegetables", label: "Vegetables", icon: "leaf-outline" },
  { key: "fruits", label: "Fruits", icon: "nutrition-outline" },
  { key: "grains", label: "Grains", icon: "flower-outline" },
  { key: "dairy", label: "Dairy", icon: "water-outline" }
];

const categoryImages = {
  vegetables: "https://images.unsplash.com/photo-1566385101042-1a0aa4c1c900?w=400&h=250&fit=crop",
  fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=250&fit=crop",
  grains: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=250&fit=crop",
  dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=250&fit=crop",
  other: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop"
};

const farmImages = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=250&fit=crop"
];

export default function ConsumerMarketplaceScreen({ navigation }) {

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { cart } = useContext(CartContext);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const fetchFarms = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/farms`);
      const data = await response.json();

      if (data.success && data.farms) {
        const enrichedFarms = data.farms.map((farm, index) => {
          const farmCategories = [...new Set(farm.products.map(p => p.category))];
          const tags = farmCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1));

          return {
            ...farm,
            image: farmImages[index % farmImages.length],
            rating: (4.0 + Math.random() * 0.9).toFixed(1),
            ratingCount: Math.floor(80 + Math.random() * 300),
            distance: `${(1 + Math.random() * 6).toFixed(1)} km`,
            deliveryTime: `${20 + Math.floor(Math.random() * 25)}-${35 + Math.floor(Math.random() * 20)} min`,
            tags,
            featured: farm.products.length >= 3
          };
        });

        setFarms(enrichedFarms);
      }
    } catch (err) {
      console.log("Failed to fetch farms:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFarms();
  }, [fetchFarms]);

  const filteredFarms = farms.filter(farm => {
    const searchMatch = searchQuery === "" ||
      farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      farm.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === "all") return searchMatch;
    return searchMatch && farm.products.some(p => p.category === selectedCategory);
  });

  const featuredFarms = farms.filter(f => f.featured);

  const renderStars = (rating) => {
    const stars = [];
    const r = parseFloat(rating);
    const full = Math.floor(r);
    for (let i = 0; i < full; i++) {
      stars.push(<Ionicons key={`f${i}`} name="star" size={11} color="#ffc107" />);
    }
    if (r % 1 >= 0.5) {
      stars.push(<Ionicons key="h" name="star-half" size={11} color="#ffc107" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#888", marginTop: 12, fontSize: 14 }}>Loading farms...</Text>
      </View>
    );
  }

  return (

    <View style={styles.container}>

      <View style={styles.statusBarSpacer} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>
            <Ionicons name="location" size={14} color="#e53935" /> Delivering to
          </Text>
          <Text style={styles.locationText}>Current Location <Ionicons name="chevron-down" size={14} color="#333" /></Text>
        </View>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate("Cart")}
        >
          <Ionicons name="cart-outline" size={26} color="#333" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
        }
      >

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            placeholder="Search farms, vegetables, fruits..."
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* BANNERS */}
        <FlatList
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.bannerList}
          renderItem={({ item }) => (
            <View style={[styles.bannerCard, { backgroundColor: item.bg }]}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.bannerEmoji}>{item.emoji}</Text>
            </View>
          )}
        />

        {/* CATEGORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryPill,
                selectedCategory === cat.key && styles.categoryPillActive
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon}
                size={15}
                color={selectedCategory === cat.key ? "#fff" : "#555"}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.key && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FEATURED FARMS - horizontal scroll */}
        {selectedCategory === "all" && searchQuery === "" && featuredFarms.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Farms</Text>
              <Text style={styles.seeAll}>See all</Text>
            </View>

            <FlatList
              data={featuredFarms}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.featuredList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.featuredCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("FarmDetail", { farm: item })}
                >
                  <Image source={{ uri: item.image }} style={styles.featuredImage} />
                  <View style={styles.featuredOverlay}>
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={10} color="#fff" />
                      <Text style={styles.featuredRating}>{item.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.featuredMeta}>
                      <Ionicons name="location-outline" size={11} color="#999" /> {item.distance}  ·  {item.deliveryTime}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* ALL FARMS - vertical list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "all" ? "All Farms Near You" :
             selectedCategory === "vegetables" ? "Vegetable Farms" :
             selectedCategory === "fruits" ? "Fruit Farms" :
             selectedCategory === "grains" ? "Grain Farms" :
             "Dairy Farms"}
          </Text>
          <Text style={styles.farmCount}>{filteredFarms.length} farms</Text>
        </View>

        {filteredFarms.map((farm) => (
          <TouchableOpacity
            key={farm.id}
            style={styles.farmCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("FarmDetail", { farm })}
          >
            {/* Farm Image */}
            <Image source={{ uri: farm.image }} style={styles.farmImage} />

            {/* Rating badge on image */}
            <View style={styles.ratingBadgeOnImage}>
              <Ionicons name="star" size={11} color="#fff" />
              <Text style={styles.ratingBadgeText}>{farm.rating}</Text>
            </View>

            {/* Delivery time badge */}
            <View style={styles.deliveryBadge}>
              <Text style={styles.deliveryBadgeText}>{farm.deliveryTime}</Text>
            </View>

            {/* Farm Info */}
            <View style={styles.farmInfo}>
              <View style={styles.farmNameRow}>
                <Text style={styles.farmName} numberOfLines={1}>{farm.name}</Text>
                <View style={styles.ratingSmall}>
                  {renderStars(farm.rating)}
                  <Text style={styles.ratingCountSmall}>({farm.ratingCount})</Text>
                </View>
              </View>

              <Text style={styles.farmOwner}>
                <Ionicons name="person-outline" size={12} color="#888" /> {farm.owner}
              </Text>

              <View style={styles.farmMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color="#4caf50" />
                  <Text style={styles.metaText}>{farm.distance}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cube-outline" size={13} color="#4caf50" />
                  <Text style={styles.metaText}>{farm.products.length} products</Text>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {farm.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredFarms.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={50} color="#ddd" />
            <Text style={styles.emptyTitle}>
              {farms.length === 0 ? "No farms available yet" : "No farms found"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {farms.length === 0
                ? "Farmers are setting up their stores. Check back soon!"
                : "Try a different search or category"}
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />

      </ScrollView>

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  statusBarSpacer: {
    height: 44
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff"
  },

  locationLabel: {
    fontSize: 12,
    color: "#888"
  },

  locationText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2
  },

  cartBtn: {
    position: "relative",
    padding: 8
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#e53935",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold"
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee"
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333"
  },

  // Banners
  bannerList: {
    paddingHorizontal: 16
  },

  bannerCard: {
    width: width - 64,
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  bannerContent: {
    flex: 1
  },

  bannerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4
  },

  bannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)"
  },

  bannerEmoji: {
    fontSize: 45,
    marginLeft: 10
  },

  // Categories
  categoryRow: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 6
  },

  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 25,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 5
  },

  categoryPillActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32"
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555"
  },

  categoryTextActive: {
    color: "#fff"
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222"
  },

  seeAll: {
    fontSize: 13,
    color: "#e53935",
    fontWeight: "600"
  },

  farmCount: {
    fontSize: 13,
    color: "#999"
  },

  // Featured farms horizontal
  featuredList: {
    paddingHorizontal: 16
  },

  featuredCard: {
    width: 200,
    marginRight: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    overflow: "hidden"
  },

  featuredImage: {
    width: 200,
    height: 120,
    resizeMode: "cover"
  },

  featuredOverlay: {
    position: "absolute",
    top: 8,
    right: 8
  },

  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3
  },

  featuredRating: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold"
  },

  featuredInfo: {
    padding: 10
  },

  featuredName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333"
  },

  featuredMeta: {
    fontSize: 11,
    color: "#999",
    marginTop: 4
  },

  // Farm cards vertical
  farmCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden"
  },

  farmImage: {
    width: "100%",
    height: 170,
    resizeMode: "cover"
  },

  ratingBadgeOnImage: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },

  ratingBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  },

  deliveryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },

  deliveryBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  },

  farmInfo: {
    padding: 14
  },

  farmNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },

  farmName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    flex: 1
  },

  ratingSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1
  },

  ratingCountSmall: {
    fontSize: 11,
    color: "#aaa",
    marginLeft: 3
  },

  farmOwner: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8
  },

  farmMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },

  metaText: {
    fontSize: 12,
    color: "#666"
  },

  tagsRow: {
    flexDirection: "row",
    gap: 8
  },

  tag: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },

  tagText: {
    fontSize: 11,
    color: "#2e7d32",
    fontWeight: "600"
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 50
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#aaa",
    marginTop: 12
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#ccc",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 40
  }

});
