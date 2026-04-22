import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { API_BASE_URL } from "@env";

const rankColors = ["#e53935", "#ff9800", "#ffc107", "#8bc34a", "#4caf50"];
const rankLabels = ["#1 Best Pick", "#2 Strong Choice", "#3 Great Option", "#4 Good Fit", "#5 Worth Trying"];

export default function CropRecommendationScreen({ navigation }) {

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const getRecommendation = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const response = await fetch(`${API_BASE_URL}/api/crop/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude })
      });

      const result = await response.json();
      setData(result.data);

    } catch (error) {
      console.log(error);
      alert("Failed to fetch recommendation");
    }
    setLoading(false);
  };

  useEffect(() => {
    getRecommendation();
  }, []);

  const handleCropPress = (crop) => {
    if (!data) return;
    navigation.navigate("CropInsight", {
      crop,
      location: data.location
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Crop Advisor</Text>
        <Text style={styles.subtitle}>AI-powered recommendations for your farm</Text>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Analyzing your location...</Text>
        </View>
      )}

      {data && (
        <View>

          {/* Location & Environment Cards */}
          <View style={styles.envGrid}>

            <View style={styles.envCard}>
              <View style={[styles.envIconBg, { backgroundColor: "#ffebee" }]}>
                <Ionicons name="location" size={20} color="#e53935" />
              </View>
              <Text style={styles.envLabel}>Location</Text>
              <Text style={styles.envValue} numberOfLines={2}>{data.location}</Text>
            </View>

            <View style={styles.envCard}>
              <View style={[styles.envIconBg, { backgroundColor: "#e3f2fd" }]}>
                <Ionicons name="cloudy" size={20} color="#2196f3" />
              </View>
              <Text style={styles.envLabel}>Season</Text>
              <Text style={styles.envValue} numberOfLines={2}>{data.season}</Text>
            </View>

          </View>

          <View style={styles.envGrid}>

            <View style={styles.envCard}>
              <View style={[styles.envIconBg, { backgroundColor: "#fff3e0" }]}>
                <Ionicons name="earth" size={20} color="#ff9800" />
              </View>
              <Text style={styles.envLabel}>Soil Type</Text>
              <Text style={styles.envValue} numberOfLines={2}>{data.soil_type}</Text>
            </View>

            <View style={styles.envCard}>
              <View style={[styles.envIconBg, { backgroundColor: "#e8f5e9" }]}>
                <Ionicons name="thermometer-outline" size={20} color="#4caf50" />
              </View>
              <Text style={styles.envLabel}>Weather</Text>
              <Text style={styles.envValue}>{data.weather.temperature}°C · {data.weather.humidity}%</Text>
            </View>

          </View>

          {/* RECOMMENDED CROPS - Ranked */}
          <View style={styles.cropsSection}>
            <Text style={styles.cropsSectionTitle}>Recommended Crops</Text>
            <Text style={styles.cropsSectionSubtitle}>Tap any crop to see market insights & profit analysis</Text>

            {data.top_crops
              .sort((a, b) => a.rank - b.rank)
              .map((crop, index) => (

              <TouchableOpacity
                key={index}
                style={styles.cropCard}
                activeOpacity={0.85}
                onPress={() => handleCropPress(crop)}
              >
                <View style={styles.cropLeft}>

                  {/* Rank badge */}
                  <View style={[styles.rankBadge, { backgroundColor: rankColors[index] || "#4caf50" }]}>
                    <Text style={styles.rankNumber}>{crop.rank}</Text>
                  </View>

                  <View style={styles.cropInfo}>
                    <Text style={styles.cropName}>{crop.name}</Text>
                    <Text style={styles.cropCategory}>{crop.category}</Text>
                    <Text style={styles.rankLabel}>{rankLabels[index] || ""}</Text>
                  </View>

                </View>

                <View style={styles.cropRight}>
                  <View style={styles.insightArrow}>
                    <Ionicons name="analytics-outline" size={16} color="#2e7d32" />
                    <Text style={styles.insightText}>Insights</Text>
                    <Ionicons name="chevron-forward" size={14} color="#2e7d32" />
                  </View>
                </View>

              </TouchableOpacity>

            ))}
          </View>

          {/* WARNINGS */}
          {data.warnings && data.warnings.length > 0 && (
            <View style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <Ionicons name="alert-circle" size={20} color="#ff9800" />
                <Text style={styles.warningTitle}>Warnings</Text>
              </View>
              {data.warnings.map((warn, index) => (
                <View key={index} style={styles.warningItem}>
                  <View style={styles.warningDot} />
                  <Text style={styles.warningText}>{warn}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 30 }} />

        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  header: {
    backgroundColor: "#2e7d32",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff"
  },

  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: 60
  },

  loadingText: {
    marginTop: 16,
    color: "#888",
    fontSize: 14
  },

  // Environment grid
  envGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12
  },

  envCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16
  },

  envIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },

  envLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4
  },

  envValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333"
  },

  // Crops section
  cropsSection: {
    marginTop: 20,
    paddingHorizontal: 16
  },

  cropsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222"
  },

  cropsSectionSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    marginBottom: 16
  },

  cropCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10
  },

  cropLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },

  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },

  rankNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold"
  },

  cropInfo: {
    flex: 1
  },

  cropName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },

  cropCategory: {
    fontSize: 12,
    color: "#888",
    textTransform: "capitalize",
    marginTop: 2
  },

  rankLabel: {
    fontSize: 10,
    color: "#4caf50",
    fontWeight: "600",
    marginTop: 3
  },

  cropRight: {},

  insightArrow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4
  },

  insightText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32"
  },

  // Warnings
  warningCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800"
  },

  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8
  },

  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e65100"
  },

  warningItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 10
  },

  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ff9800",
    marginTop: 7
  },

  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 20
  }

});
