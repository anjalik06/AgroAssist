import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@env";
import { getToken, clearAuth } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const coverImages = [
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=300&fit=crop",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=300&fit=crop"
];

export default function FarmProfileScreen({ setIsLogged, setUserRole }) {

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Editable fields
  const [farmName, setFarmName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // Product stats
  const [productStats, setProductStats] = useState({ total: 0, active: 0 });

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const [userRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/products/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const userData = await userRes.json();
      const productsData = await productsRes.json();

      if (userData.success) {
        const u = userData.user;
        setUser(u);
        setFarmName(u.farmName || "");
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setAge(u.age?.toString() || "");
        setAddressLine1(u.address?.line1 || "");
        setCity(u.address?.city || "");
        setState(u.address?.state || "");
        setPincode(u.address?.pincode || "");
      }

      if (productsData.success) {
        const products = productsData.products;
        setProductStats({
          total: products.length,
          active: products.filter(p => p.isActive).length
        });
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "First name is required");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/user/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          age: age ? Number(age) : undefined,
          farmName: farmName.trim(),
          address: {
            line1: addressLine1.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim()
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Farm profile updated!");
        setUser(data.user);
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update profile");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (!confirmed) return;
      await clearAuth();
      setIsLogged(false);
      setUserRole(null);
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await clearAuth();
            setIsLogged(false);
            setUserRole(null);
          }
        }
      ]);
    }
  };

  const displayFarmName = farmName || `${firstName || ""} ${lastName || ""}`.trim() || "My Farm";
  const coverImage = coverImages[Math.abs((displayFarmName.charCodeAt(0) || 0) % coverImages.length)];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ color: "#888", marginTop: 12 }}>Loading profile...</Text>
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

        {/* ===== COVER IMAGE ===== */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
          <View style={styles.coverContent}>
            <Text style={styles.coverTitle}>{displayFarmName}'s Farm</Text>
            <View style={styles.coverTagRow}>
              <View style={styles.coverTag}>
                <Ionicons name="storefront" size={11} color="#fff" />
                <Text style={styles.coverTagText}>Farmer Store</Text>
              </View>
              {productStats.total > 0 && (
                <View style={[styles.coverTag, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Ionicons name="cube" size={11} color="#fff" />
                  <Text style={styles.coverTagText}>{productStats.active} Live Items</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ===== PROFILE AVATAR CARD ===== */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarBox}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Farmer"}
            </Text>
            <View style={styles.phoneRow}>
              <Ionicons name="call" size={13} color="#4caf50" />
              <Text style={styles.phoneText}>{user?.phone || "Not set"}</Text>
            </View>
          </View>
        </View>

        {/* ===== STATS ===== */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={22} color="#2e7d32" />
            <Text style={styles.statValue}>{productStats.total}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#4caf50" />
            <Text style={[styles.statValue, { color: "#4caf50" }]}>{productStats.active}</Text>
            <Text style={styles.statLabel}>Live</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="eye-off-outline" size={22} color="#ff9800" />
            <Text style={[styles.statValue, { color: "#ff9800" }]}>{productStats.total - productStats.active}</Text>
            <Text style={styles.statLabel}>Hidden</Text>
          </View>
        </View>

        {/* ===== FARM DETAILS FORM ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={20} color="#2e7d32" />
            <Text style={styles.sectionTitle}>Farm Details</Text>
          </View>

          <Text style={styles.label}>Farm Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="storefront-outline" size={18} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="e.g. Green Valley Farm"
              placeholderTextColor="#bbb"
              value={farmName}
              onChangeText={setFarmName}
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputBox, styles.inputDisabled]}>
            <Ionicons name="call-outline" size={18} color="#999" />
            <Text style={styles.phoneDisplay}>{user?.phone || ""}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4caf50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* ===== OWNER DETAILS ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#2e7d32" />
            <Text style={styles.sectionTitle}>Owner Details</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>First Name *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#bbb"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#bbb"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Age</Text>
          <View style={styles.inputBox}>
            <Ionicons name="calendar-outline" size={18} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="e.g. 35"
              placeholderTextColor="#bbb"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* ===== FARM ADDRESS ===== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#2e7d32" />
            <Text style={styles.sectionTitle}>Farm Address</Text>
          </View>

          <Text style={styles.label}>Address Line</Text>
          <View style={styles.inputBox}>
            <Ionicons name="home-outline" size={18} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="Street, Village, Area"
              placeholderTextColor="#bbb"
              value={addressLine1}
              onChangeText={setAddressLine1}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#bbb"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#bbb"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Pincode</Text>
          <View style={styles.inputBox}>
            <Ionicons name="pin-outline" size={18} color="#999" />
            <TextInput
              style={styles.input}
              placeholder="e.g. 560001"
              placeholderTextColor="#bbb"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>

        {/* ===== SAVE BUTTON ===== */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ===== LOGOUT ===== */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#e53935" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  // Cover
  coverContainer: {
    position: "relative",
    height: 190
  },

  coverImage: {
    width: width,
    height: 190,
    resizeMode: "cover"
  },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)"
  },

  coverContent: {
    position: "absolute",
    bottom: 35,
    left: 20,
    right: 20
  },

  coverTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },

  coverTagRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8
  },

  coverTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46,125,50,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },

  coverTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600"
  },

  // Avatar card
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6
  },

  avatarBox: {
    position: "relative"
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center"
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4caf50",
    borderWidth: 2.5,
    borderColor: "#fff"
  },

  avatarInfo: {
    marginLeft: 14,
    flex: 1
  },

  avatarName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222"
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4
  },

  phoneText: {
    fontSize: 14,
    color: "#666"
  },

  // Stats
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16
  },

  statItem: {
    flex: 1,
    alignItems: "center"
  },

  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4
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

  // Section cards
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 18
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222"
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10
  },

  inputDisabled: {
    backgroundColor: "#f0f0f0"
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#333"
  },

  phoneDisplay: {
    flex: 1,
    fontSize: 15,
    color: "#555"
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3
  },

  verifiedText: {
    fontSize: 10,
    color: "#4caf50",
    fontWeight: "bold"
  },

  rowInputs: {
    flexDirection: "row"
  },

  // Save button
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    gap: 8
  },

  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#ffcdd2",
    gap: 8
  },

  logoutText: {
    color: "#e53935",
    fontSize: 15,
    fontWeight: "bold"
  }

});
