import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as Animatable from "react-native-animatable";
import { API_BASE_URL } from "@env";
import { getToken, saveToken, saveRole } from "../services/authStorage";

export default function RoleSelectionScreen({ setUserRole }) {

  const [loading, setLoading] = useState(false);

  const selectRole = async (role) => {

    setLoading(true);

    try {

      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/user/set-role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });

      const data = await response.json();

      if (data.success) {
        await saveToken(data.token);
        await saveRole(data.user.role);
        setUserRole(data.user.role);
      } else {
        Alert.alert("Error", data.message || "Failed to set role");
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Server Error", "Unable to set role");
    }

    setLoading(false);

  };

  return (

    <View style={styles.container}>

      <Animatable.Text animation="fadeInDown" duration={1000} style={styles.title}>
        Welcome to AgroAssist
      </Animatable.Text>

      <Animatable.Text animation="fadeIn" delay={300} style={styles.subtitle}>
        How would you like to use the app?
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={500} style={styles.cardsContainer}>

        <TouchableOpacity
          style={styles.card}
          onPress={() => selectRole("farmer")}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>🌾</Text>
          </View>
          <Text style={styles.cardTitle}>I'm a Farmer</Text>
          <Text style={styles.cardDesc}>
            Manage crops, track growth, check market prices & sell produce
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => selectRole("consumer")}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#e8f5e9" }]}>
            <Text style={styles.cardIcon}>🛒</Text>
          </View>
          <Text style={styles.cardTitle}>I'm a Consumer</Text>
          <Text style={styles.cardDesc}>
            Buy fresh produce directly from local farms
          </Text>
        </TouchableOpacity>

      </Animatable.View>

      {loading && (
        <Text style={styles.loadingText}>Setting up your account...</Text>
      )}

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#eaf4d3",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8
  },

  subtitle: {
    fontSize: 16,
    color: "#689f38",
    marginBottom: 40
  },

  cardsContainer: {
    width: "100%",
    gap: 20
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff8e1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },

  cardIcon: {
    fontSize: 35
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8
  },

  cardDesc: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 20
  },

  loadingText: {
    marginTop: 20,
    color: "#689f38",
    fontSize: 14
  }

});
