import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

const categoriesList = [
  { key: "vegetables", label: "Vegetables", icon: "leaf", color: "#4caf50" },
  { key: "fruits", label: "Fruits", icon: "nutrition", color: "#ff5722" },
  { key: "grains", label: "Grains", icon: "grid", color: "#ff9800" },
  { key: "dairy", label: "Dairy", icon: "water", color: "#2196f3" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal", color: "#9c27b0" }
];

const stockOptions = [
  { key: "available", label: "In Stock", color: "#4caf50", icon: "checkmark-circle" },
  { key: "limited", label: "Limited", color: "#ff9800", icon: "alert-circle" },
  { key: "out_of_stock", label: "Out of Stock", color: "#e53935", icon: "close-circle" }
];

const farmCoverImages = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=300&fit=crop"
];

export default function MarketplaceScreen({ navigation }) {

  const [products, setProducts] = useState([]);
  const [farmInfo, setFarmInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedTab, setSelectedTab] = useState("all");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("vegetables");
  const [imageUri, setImageUri] = useState("");
  const [quantity, setQuantity] = useState("50");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  const fetchAll = async () => {
    const token = await getToken();
    try {
      const [productsRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const productsData = await productsRes.json();
      const userData = await userRes.json();

      if (productsData.success) setProducts(productsData.products);
      if (userData.success) setFarmInfo(userData.user);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setUnit("kg");
    setCategory("vegetables");
    setImageUri("");
    setQuantity("50");
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setUnit(product.unit);
    setCategory(product.category);
    setImageUri(product.image);
    setQuantity(product.quantity !== undefined ? product.quantity.toString() : "50");
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera roll access is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageUri(base64);
    }
  };

  const saveProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Product name is required");
      return;
    }
    if (!price || isNaN(price)) {
      Alert.alert("Error", "Valid price is required");
      return;
    }

    setSaving(true);
    const token = await getToken();

    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        unit,
        category,
        image: imageUri,
        quantity: Number(quantity) || 0
      };

      let response;

      if (editingProduct) {
        response = await fetch(`${API_BASE_URL}/api/products/update/${editingProduct._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/products/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
      }

      const data = await response.json();

      if (data.success) {
        setModalVisible(false);
        fetchAll();
      } else {
        Alert.alert("Error", data.message || "Failed to save");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to save product");
    }
    setSaving(false);
  };

  const deleteProduct = (product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const token = await getToken();
            try {
              await fetch(`${API_BASE_URL}/api/products/delete/${product._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchAll();
            } catch (err) {
              console.log(err);
            }
          }
        }
      ]
    );
  };

  const toggleActive = async (product) => {
    const token = await getToken();
    try {
      await fetch(`${API_BASE_URL}/api/products/update/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !product.isActive })
      });
      fetchAll();
    } catch (err) {
      console.log(err);
    }
  };

  const activeCount = products.filter(p => p.isActive).length;
  const totalProducts = products.length;
  const farmName = farmInfo
    ? `${farmInfo.firstName || ""} ${farmInfo.lastName || ""}`.trim() || "My Farm"
    : "My Farm";
  const coverImage = farmCoverImages[Math.abs((farmName.charCodeAt(0) || 0) % farmCoverImages.length)];

  // Filter products by tab
  const filteredProducts = selectedTab === "all"
    ? products
    : products.filter(p => p.category === selectedTab);

  // Get category counts
  const getCategoryCount = (key) => products.filter(p => p.category === key).length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading your store...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
        }
      >

        {/* ===== FARM COVER & PROFILE (like Swiggy restaurant header) ===== */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />

          {/* Farm name on cover */}
          <View style={styles.coverContent}>
            <Text style={styles.coverFarmName}>{farmName}'s Farm</Text>
            <View style={styles.coverBadge}>
              <Ionicons name="storefront" size={12} color="#fff" />
              <Text style={styles.coverBadgeText}>Farmer Store</Text>
            </View>
          </View>
        </View>

        {/* FARM INFO CARD - overlapping cover */}
        <View style={styles.farmCard}>
          <View style={styles.farmCardTop}>
            <View style={styles.farmAvatarBox}>
              <View style={styles.farmAvatar}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.farmDetails}>
              <Text style={styles.farmNameText}>{farmName}'s Farm Store</Text>
              <Text style={styles.farmPhone}>
                <Ionicons name="call-outline" size={12} color="#888" /> {farmInfo?.phone || "Not set"}
              </Text>
              {farmInfo?.address?.city ? (
                <Text style={styles.farmLocation}>
                  <Ionicons name="location-outline" size={12} color="#888" /> {farmInfo.address.city}{farmInfo.address.state ? `, ${farmInfo.address.state}` : ""}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Stats row - like Swiggy restaurant stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statValueRow}>
                <View style={[styles.statusDot, { backgroundColor: "#4caf50" }]} />
                <Text style={[styles.statValue, { color: "#4caf50" }]}>{activeCount}</Text>
              </View>
              <Text style={styles.statLabel}>Live</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statValueRow}>
                <View style={[styles.statusDot, { backgroundColor: "#ff9800" }]} />
                <Text style={[styles.statValue, { color: "#ff9800" }]}>{totalProducts - activeCount}</Text>
              </View>
              <Text style={styles.statLabel}>Hidden</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#2196f3" }]}>
                {products.filter(p => p.stock === "available").length}
              </Text>
              <Text style={styles.statLabel}>In Stock</Text>
            </View>
          </View>
        </View>

        {/* ===== MENU SECTION (like Swiggy restaurant menu) ===== */}
        <View style={styles.menuSection}>

          {/* Section header with Add button */}
          <View style={styles.menuHeaderRow}>
            <View>
              <Text style={styles.menuTitle}>Menu</Text>
              <Text style={styles.menuSubtitle}>{totalProducts} items listed</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.addProductBtn, { backgroundColor: "#ff9800" }]}
                onPress={() => navigation.navigate("FarmerOrders")}
              >
                <Ionicons name="receipt-outline" size={18} color="#fff" />
                <Text style={styles.addProductBtnText}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addProductBtn} onPress={openAddModal}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addProductBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category tabs - horizontal scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            <TouchableOpacity
              style={[styles.tabPill, selectedTab === "all" && styles.tabPillActive]}
              onPress={() => setSelectedTab("all")}
            >
              <Text style={[styles.tabText, selectedTab === "all" && styles.tabTextActive]}>
                All ({totalProducts})
              </Text>
            </TouchableOpacity>
            {categoriesList.map(cat => {
              const count = getCategoryCount(cat.key);
              if (count === 0) return null;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.tabPill, selectedTab === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setSelectedTab(selectedTab === cat.key ? "all" : cat.key)}
                >
                  <Ionicons name={cat.icon} size={13} color={selectedTab === cat.key ? "#fff" : cat.color} />
                  <Text style={[styles.tabText, selectedTab === cat.key && styles.tabTextActive]}>
                    {cat.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Menu divider */}
          <View style={styles.menuDividerRow}>
            <View style={styles.menuDividerLine} />
            <Text style={styles.menuDividerText}>
              {selectedTab === "all" ? "ALL ITEMS" : selectedTab.toUpperCase()}
            </Text>
            <View style={styles.menuDividerLine} />
          </View>

          {/* Products list */}
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={50} color="#ddd" />
              <Text style={styles.emptyTitle}>
                {totalProducts === 0 ? "Your menu is empty" : `No ${selectedTab} items`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {totalProducts === 0
                  ? "Start adding products to your farm store"
                  : "Try a different category"}
              </Text>
              {totalProducts === 0 && (
                <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.emptyBtnText}>Add First Item</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredProducts.map((product, index) => {
              const stockInfo = stockOptions.find(s => s.key === product.stock) || stockOptions[0];
              const catInfo = categoriesList.find(c => c.key === product.category) || categoriesList[4];
              const isVeg = product.category === "vegetables" || product.category === "grains";

              return (
                <View key={product._id}>
                  <View style={[styles.menuItem, !product.isActive && styles.menuItemInactive]}>

                    {/* Left side - product details */}
                    <View style={styles.menuItemLeft}>

                      {/* Veg/Non-veg indicator */}
                      <View style={[styles.vegIndicator, { borderColor: isVeg ? "#4caf50" : "#e53935" }]}>
                        <View style={[styles.vegDot, { backgroundColor: isVeg ? "#4caf50" : "#e53935" }]} />
                      </View>

                      <Text style={styles.menuItemName}>{product.name}</Text>
                      <Text style={styles.menuItemPrice}>{"\u20B9"}{product.price}/{product.unit}</Text>

                      {product.description ? (
                        <Text style={styles.menuItemDesc} numberOfLines={2}>{product.description}</Text>
                      ) : null}

                      {/* Status badges */}
                      <View style={styles.badgesRow}>
                        <View style={[styles.statusBadge, { backgroundColor: stockInfo.color + "15" }]}>
                          <Ionicons name={stockInfo.icon} size={11} color={stockInfo.color} />
                          <Text style={[styles.statusBadgeText, { color: stockInfo.color }]}>
                            {product.quantity !== undefined ? `${product.quantity} ${product.unit}` : stockInfo.label}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: catInfo.color + "15" }]}>
                          <Ionicons name={catInfo.icon} size={11} color={catInfo.color} />
                          <Text style={[styles.statusBadgeText, { color: catInfo.color }]}>{catInfo.label}</Text>
                        </View>
                        {!product.isActive && (
                          <View style={[styles.statusBadge, { backgroundColor: "#e0e0e0" }]}>
                            <Ionicons name="eye-off" size={11} color="#888" />
                            <Text style={[styles.statusBadgeText, { color: "#888" }]}>Hidden</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Right side - image & actions */}
                    <View style={styles.menuItemRight}>
                      <View style={styles.menuImageBox}>
                        {product.image ? (
                          <Image source={{ uri: product.image }} style={styles.menuImage} />
                        ) : (
                          <View style={styles.menuNoImage}>
                            <Ionicons name="image-outline" size={24} color="#ccc" />
                          </View>
                        )}
                        {!product.isActive && (
                          <View style={styles.imageOverlayHidden}>
                            <Ionicons name="eye-off" size={14} color="#fff" />
                          </View>
                        )}
                      </View>

                      {/* Quick action buttons under image */}
                      <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickBtn} onPress={() => openEditModal(product)}>
                          <Ionicons name="create-outline" size={16} color="#2196f3" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickBtn} onPress={() => toggleActive(product)}>
                          <Ionicons
                            name={product.isActive ? "eye-off-outline" : "eye-outline"}
                            size={16}
                            color="#ff9800"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickBtn} onPress={() => deleteProduct(product)}>
                          <Ionicons name="trash-outline" size={16} color="#e53935" />
                        </TouchableOpacity>
                      </View>
                    </View>

                  </View>

                  {/* Divider between items */}
                  {index < filteredProducts.length - 1 && <View style={styles.itemDivider} />}
                </View>
              );
            })
          )}

        </View>

        <View style={{ height: 100 }} />

      </ScrollView>

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ADD/EDIT MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingProduct ? "Edit Item" : "Add New Item"}
              </Text>
              <View style={{ width: 26 }} />
            </View>

            {/* Image Picker - large area like Swiggy */}
            <View style={styles.imagePickerSection}>
              {imageUri ? (
                <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.changePhotoOverlay}>
                    <Ionicons name="camera" size={18} color="#fff" />
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.cameraIconCircle}>
                    <Ionicons name="camera-outline" size={32} color="#2e7d32" />
                  </View>
                  <Text style={styles.imagePlaceholderTitle}>Add Item Photo</Text>
                  <Text style={styles.imagePlaceholderSubtext}>A good photo increases orders by 30%</Text>
                  <View style={styles.imageButtons}>
                    <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
                      <Ionicons name="camera" size={18} color="#fff" />
                      <Text style={styles.imageBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.imageBtn, styles.imageBtnOutline]} onPress={pickImage}>
                      <Ionicons name="images" size={18} color="#2e7d32" />
                      <Text style={[styles.imageBtnText, { color: "#2e7d32" }]}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Item Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Fresh Tomatoes"
                placeholderTextColor="#bbb"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Describe your product — freshness, quality, growing method..."
                placeholderTextColor="#bbb"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Price ({"\u20B9"}) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="30"
                    placeholderTextColor="#bbb"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Per Unit</Text>
                  <View style={styles.unitRow}>
                    {["kg", "piece", "dozen", "litre"].map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, unit === u && styles.unitChipActive]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {categoriesList.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={category === cat.key ? "#fff" : cat.color}
                    />
                    <Text style={[styles.catChipText, category === cat.key && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Stock Quantity ({unit})</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 50"
                placeholderTextColor="#bbb"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <Text style={{ fontSize: 11, color: "#999", marginTop: -8, marginBottom: 12 }}>
                {Number(quantity) === 0 ? "Out of Stock" : Number(quantity) <= 5 ? "Limited Stock" : "In Stock"} — auto-updates based on quantity
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveProduct}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {editingProduct ? "Update Item" : "Add to Menu"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />

          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  // ===== COVER IMAGE =====
  coverContainer: {
    position: "relative",
    height: 200
  },

  coverImage: {
    width: width,
    height: 200,
    resizeMode: "cover"
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)"
  },

  coverContent: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20
  },

  coverFarmName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },

  coverBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46,125,50,0.9)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 5
  },

  coverBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  },

  // ===== FARM INFO CARD =====
  farmCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },

  farmCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },

  farmAvatarBox: {
    position: "relative"
  },

  farmAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center"
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "#fff"
  },

  farmDetails: {
    marginLeft: 14,
    flex: 1
  },

  farmNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222"
  },

  farmPhone: {
    fontSize: 12,
    color: "#888",
    marginTop: 3
  },

  farmLocation: {
    fontSize: 12,
    color: "#888",
    marginTop: 2
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    paddingVertical: 14
  },

  statBox: {
    flex: 1,
    alignItems: "center"
  },

  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4
  },

  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },

  statLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 2
  },

  statDivider: {
    width: 1,
    backgroundColor: "#eee"
  },

  // ===== MENU SECTION =====
  menuSection: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    minHeight: 300
  },

  menuHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16
  },

  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222"
  },

  menuSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2
  },

  addProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6
  },

  addProductBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13
  },

  // Category tabs
  tabsScroll: {
    paddingHorizontal: 16,
    marginBottom: 12
  },

  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    marginRight: 8,
    gap: 5
  },

  tabPillActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32"
  },

  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666"
  },

  tabTextActive: {
    color: "#fff"
  },

  // Menu divider
  menuDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8
  },

  menuDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee"
  },

  menuDividerText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#aaa",
    letterSpacing: 2,
    marginHorizontal: 14
  },

  // Menu items (Swiggy restaurant style)
  menuItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16
  },

  menuItemInactive: {
    opacity: 0.55
  },

  menuItemLeft: {
    flex: 1,
    paddingRight: 12
  },

  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },

  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3
  },

  menuItemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6
  },

  menuItemDesc: {
    fontSize: 12,
    color: "#aaa",
    lineHeight: 17,
    marginBottom: 8
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600"
  },

  // Right side
  menuItemRight: {
    alignItems: "center",
    width: 110
  },

  menuImageBox: {
    width: 105,
    height: 85,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f8f8f8"
  },

  menuImage: {
    width: 105,
    height: 85,
    resizeMode: "cover"
  },

  menuNoImage: {
    width: 105,
    height: 85,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5"
  },

  imageOverlayHidden: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center"
  },

  quickActions: {
    flexDirection: "row",
    marginTop: 6,
    gap: 2
  },

  quickBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f8f8f8"
  },

  itemDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 20
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 50
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#aaa",
    marginTop: 14
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#ccc",
    marginTop: 6
  },

  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8
  },

  emptyBtnText: {
    color: "#fff",
    fontWeight: "bold"
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6
  },

  // ===== MODAL =====
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },

  // Image picker
  imagePickerSection: {
    paddingHorizontal: 20,
    marginBottom: 20
  },

  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    resizeMode: "cover"
  },

  changePhotoOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },

  changePhotoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },

  imagePlaceholder: {
    backgroundColor: "#f8faf5",
    borderWidth: 2,
    borderColor: "#c8e6c9",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center"
  },

  cameraIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },

  imagePlaceholderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4
  },

  imagePlaceholderSubtext: {
    fontSize: 12,
    color: "#999",
    marginBottom: 18
  },

  imageButtons: {
    flexDirection: "row",
    gap: 12
  },

  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6
  },

  imageBtnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#2e7d32"
  },

  imageBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13
  },

  // Form
  formSection: {
    paddingHorizontal: 20
  },

  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 16
  },

  formInput: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333"
  },

  textArea: {
    height: 80,
    textAlignVertical: "top"
  },

  formRow: {
    flexDirection: "row"
  },

  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },

  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eee"
  },

  unitChipActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#2e7d32"
  },

  unitChipText: {
    fontSize: 12,
    color: "#666"
  },

  unitChipTextActive: {
    color: "#2e7d32",
    fontWeight: "bold"
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },

  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    borderWidth: 1.5,
    borderColor: "#eee",
    gap: 5
  },

  catChipText: {
    fontSize: 12,
    color: "#666"
  },

  catChipTextActive: {
    color: "#fff",
    fontWeight: "bold"
  },

  stockRow: {
    flexDirection: "row",
    gap: 8
  },

  stockChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#eee",
    gap: 5
  },

  stockChipText: {
    fontSize: 12,
    color: "#888"
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    marginHorizontal: 20,
    marginTop: 28,
    padding: 16,
    borderRadius: 14,
    gap: 8
  },

  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }

});
