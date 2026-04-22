import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@env";
import { getToken, clearAuth } from "../services/authStorage";

export default function ConsumerProfileScreen({ setIsLogged, setUserRole }) {

  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState({
    line1: "",
    city: "",
    state: "",
    pincode: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {

    const token = await getToken();

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPhone(data.user.phone);
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setAge(data.user.age?.toString() || "");
        if (data.user.address) {
          setAddress({
            line1: data.user.address.line1 || "",
            city: data.user.address.city || "",
            state: data.user.address.state || "",
            pincode: data.user.address.pincode || ""
          });
        }
      }
    } catch (error) {
      console.log(error);
    }

  };

  const updateProfile = async () => {

    const token = await getToken();

    try {
      await fetch(`${API_BASE_URL}/api/user/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          age,
          address
        })
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update profile");
    }

  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (!confirmed) return;
      await clearAuth();
      setUserRole(null);
      setIsLogged(false);
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await clearAuth();
            setUserRole(null);
            setIsLogged(false);
          }
        }
      ]);
    }
  };

  return (

    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Status bar spacer */}
      <View style={{ height: 50 }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.phoneText}>{phone}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="cart" size={12} color="#fff" />
          <Text style={styles.roleText}>Consumer</Text>
        </View>
      </View>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#2e7d32" />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            placeholder="Enter last name"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            placeholder="Enter age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>
      </View>

      {/* Delivery Address Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={20} color="#2e7d32" />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address Line</Text>
          <TextInput
            placeholder="House no, Street, Area"
            value={address.line1}
            onChangeText={(text) => setAddress({ ...address, line1: text })}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              placeholder="City"
              value={address.city}
              onChangeText={(text) => setAddress({ ...address, city: text })}
              style={styles.input}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              placeholder="State"
              value={address.state}
              onChangeText={(text) => setAddress({ ...address, state: text })}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pincode</Text>
          <TextInput
            placeholder="Pincode"
            value={address.pincode}
            onChangeText={(text) => setAddress({ ...address, pincode: text })}
            keyboardType="numeric"
            maxLength={6}
            style={[styles.input, { width: "50%" }]}
          />
        </View>
      </View>

      {/* Update Button */}
      <TouchableOpacity style={styles.updateBtn} onPress={updateProfile}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        <Text style={styles.updateBtnText}>Update Profile</Text>
      </TouchableOpacity>

      {/* My Orders Placeholder */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="receipt-outline" size={20} color="#2e7d32" />
          <Text style={styles.sectionTitle}>My Orders</Text>
        </View>
        <View style={styles.emptyOrders}>
          <Ionicons name="bag-outline" size={40} color="#ddd" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Your order history will appear here</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#e53935" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f8f9fa"
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 20
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333"
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 24
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 12
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },

  phoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5
  },

  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },

  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },

  inputGroup: {
    marginBottom: 14
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  input: {
    backgroundColor: "#f8f9fa",
    padding: 13,
    borderRadius: 10,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee"
  },

  row: {
    flexDirection: "row"
  },

  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8
  },

  updateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },

  emptyOrders: {
    alignItems: "center",
    paddingVertical: 24
  },

  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#aaa",
    marginTop: 10
  },

  emptySubtext: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 4
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffcdd2",
    gap: 8
  },

  logoutText: {
    color: "#e53935",
    fontSize: 16,
    fontWeight: "bold"
  }

});
