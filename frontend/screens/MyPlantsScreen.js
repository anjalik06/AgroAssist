import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";
import { useFocusEffect } from "@react-navigation/native";
import { getCropInfo, computeProgress } from "../constants/cropCycles";

function getPlantInsights(plant) {
  const base = computeProgress(plant.name, plant.sowingDate);

  if (plant.overriddenStage) {
    const info = getCropInfo(plant.name);
    const overrideIdx = info.stages.findIndex(s => s.name === plant.overriddenStage);
    if (overrideIdx >= 0) {
      const stage = info.stages[overrideIdx];
      const midDay = Math.round((stage.dayRange[0] + stage.dayRange[1]) / 2);
      const progress = Math.min(100, Math.max(0, Math.round((midDay / info.totalDays) * 100)));
      return {
        ...base,
        progress,
        stageName: stage.name,
        stageIndex: overrideIdx,
        daysLeft: Math.max(0, info.totalDays - midDay),
        overridden: true
      };
    }
  }

  return { ...base, overridden: false };
}

// Mini circle progress
const MiniCircle = ({ progress, color, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#f0f0f0" strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute" }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#333" }}>{progress}%</Text>
      </View>
    </View>
  );
};

const getProgressColor = (p) => {
  if (p < 20) return "#AED581";
  if (p < 40) return "#81C784";
  if (p < 60) return "#66BB6A";
  if (p < 80) return "#FFB74D";
  return "#FF8A65";
};

const getStageColor = (index, total) => {
  const colors = ["#AED581", "#81C784", "#66BB6A", "#FFB74D", "#FF8A65", "#8D6E63"];
  return colors[Math.min(index, colors.length - 1)];
};

export default function MyPlantsScreen({ navigation }) {
  const [plants, setPlants] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchPlants();
    }, [])
  );

  const fetchPlants = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/plants/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.plants)) {
        setPlants(data.plants);
      } else {
        setPlants([]);
      }
    } catch (err) {
      console.log(err);
    }
    setRefreshing(false);
  };

  const deletePlant = async (plantId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/plants/${plantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlants((prev) => prev.filter((p) => p._id !== plantId));
      } else {
        Alert.alert("Delete failed", data.message || data.error || "Unknown error");
      }
    } catch (err) {
      Alert.alert("Delete failed", err.message || "Network error");
    }
  };

  const confirmDelete = (plant) => {
    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" && window.confirm
        ? window.confirm(`Remove "${plant.name}" from your tracker?`)
        : true;
      if (ok) deletePlant(plant._id);
      return;
    }
    Alert.alert(
      "Delete plant?",
      `Remove "${plant.name}" from your tracker?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deletePlant(plant._id) }
      ]
    );
  };


  const renderPlant = ({ item }) => {
    const info = getPlantInsights(item);
    const color = getProgressColor(info.progress);
    const stageClr = getStageColor(info.stageIndex, info.totalStages);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardLeft}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Growth", { plant: item })}
        >
          <MiniCircle progress={info.progress} color={color} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardCenter}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Growth", { plant: item })}
        >
          <View style={styles.cardNameRow}>
            <Text style={styles.cropIcon}>{info.icon}</Text>
            <Text style={styles.cardName}>{item.name}</Text>
          </View>

          {/* Stage badge */}
          <View style={[styles.cardStageBadge, { backgroundColor: stageClr }]}>
            <Text style={styles.cardStageText}>{info.stageName}</Text>
          </View>

          {/* Info row */}
          <View style={styles.cardInfoRow}>
            <View style={styles.cardInfoItem}>
              <Ionicons name="calendar-outline" size={11} color="#999" />
              <Text style={styles.cardInfoText}>{item.sowingDate}</Text>
            </View>
            <View style={styles.cardInfoItem}>
              <Ionicons name="time-outline" size={11} color="#999" />
              <Text style={styles.cardInfoText}>Day {info.days}/{info.totalDays}</Text>
            </View>
          </View>

          {/* Mini stage dots */}
          <View style={styles.stageDots}>
            {Array.from({ length: info.totalStages }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i <= info.stageIndex ? getStageColor(i, info.totalStages) : "#E0E0E0",
                    width: i === info.stageIndex ? 16 : 8
                  }
                ]}
              />
            ))}
          </View>
        </TouchableOpacity>

        <View style={styles.cardRight}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDelete(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#e53935" />
          </TouchableOpacity>
          <Text style={styles.daysLeftNum}>{info.daysLeft}</Text>
          <Text style={styles.daysLeftLabel}>days left</Text>
        </View>
      </View>
    );
  };

  // Summary stats
  const totalPlants = plants.length;
  const harvestReady = plants.filter(p => getPlantInsights(p).progress >= 90).length;
  const avgProgress = totalPlants > 0
    ? Math.round(plants.reduce((sum, p) => sum + getPlantInsights(p).progress, 0) / totalPlants)
    : 0;

  return (
    <View style={styles.container}>

      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalPlants}</Text>
          <Text style={styles.statLabel}>Total Plants</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{avgProgress}%</Text>
          <Text style={styles.statLabel}>Avg Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, harvestReady > 0 && { color: "#FF8A65" }]}>{harvestReady}</Text>
          <Text style={styles.statLabel}>Near Harvest</Text>
        </View>
      </View>

      {/* Plant List */}
      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>🌱</Text>
          <Text style={styles.emptyTitle}>No plants yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your crops to get growth insights</Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item._id}
          renderItem={renderPlant}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPlants(); }} colors={["#7CB342"]} />
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AddPlant")}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addText}>Add Plant</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4
  },

  statNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#7CB342"
  },

  statLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    fontWeight: "600"
  },

  // Plant Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: 12,
    alignItems: "center"
  },

  cardLeft: {
    alignItems: "center"
  },

  cardCenter: {
    flex: 1
  },

  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },

  cropIcon: {
    fontSize: 18
  },

  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333"
  },

  cardStageBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6
  },

  cardStageText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff"
  },

  cardInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6
  },

  cardInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },

  cardInfoText: {
    fontSize: 11,
    color: "#999"
  },

  stageDots: {
    flexDirection: "row",
    gap: 3,
    marginTop: 8,
    alignItems: "center"
  },

  dot: {
    height: 4,
    borderRadius: 2
  },

  cardRight: {
    alignItems: "center",
    minWidth: 50,
    gap: 4
  },

  deleteBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#ffebee"
  },

  daysLeftNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333"
  },

  daysLeftLabel: {
    fontSize: 9,
    color: "#aaa",
    fontWeight: "600"
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#bbb",
    marginTop: 12
  },

  emptySubtext: {
    fontSize: 13,
    color: "#ddd",
    marginTop: 4,
    textAlign: "center"
  },

  // Add Button
  addBtn: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7CB342",
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#7CB342",
    shadowOpacity: 0.3,
    shadowRadius: 8
  },

  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  }
});
