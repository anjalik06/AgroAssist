import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polyline, Line, Circle as SvgCircle } from "react-native-svg";
import { API_BASE_URL } from "@env";

// Mini sparkline chart component
const SparkLine = ({ data, color, width = 80, height = 32 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((val, i) => `${i * stepX},${height - ((val - min) / range) * (height - 4) - 2}`)
    .join(" ");

  const lastX = (data.length - 1) * stepX;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgCircle cx={lastX} cy={lastY} r="3" fill={color} />
    </Svg>
  );
};

// Bigger detail chart
const DetailChart = ({ data, color, width = 300, height = 140 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const days = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

  const points = data
    .map((val, i) => `${i * stepX},${height - 30 - ((val - min) / range) * (height - 50)}`)
    .join(" ");

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 1, 2, 3].map(i => {
          const y = 10 + (i / 3) * (height - 50);
          const val = Math.round(max - (i / 3) * range);
          return (
            <React.Fragment key={i}>
              <Line x1="0" y1={y} x2={width} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <Svg>
                <Line x1="0" y1={0} x2="0" y2="0" />
              </Svg>
            </React.Fragment>
          );
        })}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {data.map((val, i) => {
          const x = i * stepX;
          const y = height - 30 - ((val - min) / range) * (height - 50);
          return <SvgCircle key={i} cx={x} cy={y} r="4" fill={color} />;
        })}
      </Svg>
      {/* X-axis labels */}
      <View style={styles.chartLabels}>
        {days.map((d, i) => (
          <Text key={i} style={styles.chartLabel}>{d}</Text>
        ))}
      </View>
    </View>
  );
};

const categories = [
  { key: "all", label: "All" },
  { key: "vegetable", label: "Vegetables" },
  { key: "fruit", label: "Fruits" },
  { key: "grain", label: "Grains" },
];

export default function MarketPriceScreen() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [date, setDate] = useState("");
  const [sourceTag, setSourceTag] = useState("");

  useEffect(() => {
    fetchPrices();
  }, [activeCategory]);

  const fetchPrices = async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.append("category", activeCategory);
      const res = await fetch(`${API_BASE_URL}/api/market/prices?${params}`);
      const data = await res.json();
      if (data.success) {
        const nextPrices = Array.isArray(data.prices) ? data.prices : [];
        setPrices(nextPrices);
        setDate(data.date);

        const hasRealRows = nextPrices.some((row) => row.dataSource === "real");
        const hasGovSource = String(data.source || "").toLowerCase().includes("gov");
        setSourceTag((hasRealRows || hasGovSource) ? "LIVE" : "SIM");
      }
    } catch (err) {
      console.log("Market price fetch error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrices();
  };

  const filtered = search
    ? prices.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : prices;

  // Stats
  const gainers = [...prices].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const losers = [...prices].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  const renderItem = ({ item }) => {
    const isUp = item.change >= 0;
    const trendColor = isUp ? "#4CAF50" : "#F44336";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedCrop(item)}
      >
        <Text style={styles.cropIcon}>{item.icon}</Text>

        <View style={styles.cardMiddle}>
          <Text style={styles.cropName}>{item.name}</Text>
          <View style={styles.changeRow}>
            <Ionicons
              name={isUp ? "caret-up" : "caret-down"}
              size={12}
              color={trendColor}
            />
            <Text style={[styles.changeText, { color: trendColor }]}>
              {isUp ? "+" : ""}{item.changePercent}%
            </Text>
          </View>
        </View>

        <SparkLine data={item.history} color={trendColor} />

        <View style={styles.priceCol}>
          <Text style={styles.priceValue}>₹{item.price}</Text>
          <Text style={styles.priceUnit}>/{item.unit}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#7CB342" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Market Prices</Text>
        <View style={styles.headerRight}>
          {sourceTag ? (
            <Text style={[
              styles.sourceTag,
              sourceTag === "LIVE" ? styles.sourceTagLive : styles.sourceTagSim
            ]}>
              {sourceTag}
            </Text>
          ) : null}
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#aaa" />
        <TextInput
          placeholder="Search crops..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          placeholderTextColor="#bbb"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category pills */}
      <View style={styles.categoryRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryPill,
              activeCategory === cat.key && styles.categoryPillActive
            ]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text style={[
              styles.categoryText,
              activeCategory === cat.key && styles.categoryTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top movers row */}
      <View style={styles.moversRow}>
        <View style={styles.moverCard}>
          <Text style={styles.moverLabel}>Top Gainer</Text>
          {gainers[0] && (
            <View style={styles.moverInfo}>
              <Text style={styles.moverEmoji}>{gainers[0].icon}</Text>
              <Text style={styles.moverName}>{gainers[0].name}</Text>
              <Text style={[styles.moverChange, { color: "#4CAF50" }]}>
                +{gainers[0].changePercent}%
              </Text>
            </View>
          )}
        </View>
        <View style={styles.moverCard}>
          <Text style={styles.moverLabel}>Top Loser</Text>
          {losers[0] && (
            <View style={styles.moverInfo}>
              <Text style={styles.moverEmoji}>{losers[0].icon}</Text>
              <Text style={styles.moverName}>{losers[0].name}</Text>
              <Text style={[styles.moverChange, { color: "#F44336" }]}>
                {losers[0].changePercent}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Price list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7CB342"]} />
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedCrop}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCrop(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCrop && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>{selectedCrop.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedCrop.name}</Text>
                    <Text style={styles.modalCategory}>{selectedCrop.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCrop(null)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* Price section */}
                <View style={styles.modalPriceSection}>
                  <Text style={styles.modalPrice}>₹{selectedCrop.price}/{selectedCrop.unit}</Text>
                  <View style={[
                    styles.modalChangeBadge,
                    { backgroundColor: selectedCrop.change >= 0 ? "#E8F5E9" : "#FFEBEE" }
                  ]}>
                    <Ionicons
                      name={selectedCrop.change >= 0 ? "caret-up" : "caret-down"}
                      size={14}
                      color={selectedCrop.change >= 0 ? "#4CAF50" : "#F44336"}
                    />
                    <Text style={{
                      color: selectedCrop.change >= 0 ? "#4CAF50" : "#F44336",
                      fontWeight: "bold",
                      fontSize: 14
                    }}>
                      {selectedCrop.change >= 0 ? "+" : ""}{selectedCrop.changePercent}% today
                    </Text>
                  </View>
                </View>

                {/* 7-day chart */}
                <Text style={styles.chartTitle}>7-Day Price Trend</Text>
                <View style={styles.chartContainer}>
                  <DetailChart
                    data={selectedCrop.history}
                    color={selectedCrop.change >= 0 ? "#4CAF50" : "#F44336"}
                  />
                </View>

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>7d High</Text>
                    <Text style={styles.statBoxValue}>₹{selectedCrop.high7d}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>7d Low</Text>
                    <Text style={styles.statBoxValue}>₹{selectedCrop.low7d}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>Week Change</Text>
                    <Text style={[styles.statBoxValue, {
                      color: selectedCrop.weekChange >= 0 ? "#4CAF50" : "#F44336"
                    }]}>
                      {selectedCrop.weekChange >= 0 ? "+" : ""}{selectedCrop.weekChange}%
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>Daily Chg</Text>
                    <Text style={[styles.statBoxValue, {
                      color: selectedCrop.change >= 0 ? "#4CAF50" : "#F44336"
                    }]}>
                      {selectedCrop.change >= 0 ? "+" : ""}₹{selectedCrop.change}
                    </Text>
                  </View>
                </View>

                {/* Price history list */}
                <Text style={styles.chartTitle}>Daily Prices</Text>
                {selectedCrop.history.map((price, i) => {
                  const days = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"];
                  const prev = i > 0 ? selectedCrop.history[i - 1] : price;
                  const diff = price - prev;
                  return (
                    <View key={i} style={styles.historyRow}>
                      <Text style={styles.historyDay}>{days[i]}</Text>
                      <Text style={styles.historyPrice}>₹{price}</Text>
                      {i > 0 && (
                        <View style={styles.historyChange}>
                          <Ionicons
                            name={diff >= 0 ? "caret-up" : "caret-down"}
                            size={10}
                            color={diff >= 0 ? "#4CAF50" : "#F44336"}
                          />
                          <Text style={{ fontSize: 11, color: diff >= 0 ? "#4CAF50" : "#F44336" }}>
                            {Math.abs(Math.round(diff * 10) / 10)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingTop: 16
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222"
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },

  sourceTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden"
  },

  sourceTagLive: {
    backgroundColor: "#4CAF50"
  },

  sourceTagSim: {
    backgroundColor: "#F57C00"
  },

  dateText: {
    fontSize: 12,
    color: "#999",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    padding: 0
  },

  categoryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },

  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8e8e8"
  },

  categoryPillActive: {
    backgroundColor: "#7CB342",
    borderColor: "#7CB342"
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888"
  },

  categoryTextActive: {
    color: "#fff"
  },

  // Movers
  moversRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },

  moverCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4
  },

  moverLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    marginBottom: 6
  },

  moverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },

  moverEmoji: {
    fontSize: 16
  },

  moverName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1
  },

  moverChange: {
    fontSize: 13,
    fontWeight: "bold"
  },

  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4
  },

  cropIcon: {
    fontSize: 28
  },

  cardMiddle: {
    flex: 1
  },

  cropName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222"
  },

  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2
  },

  changeText: {
    fontSize: 12,
    fontWeight: "600"
  },

  priceCol: {
    alignItems: "flex-end"
  },

  priceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222"
  },

  priceUnit: {
    fontSize: 11,
    color: "#aaa"
  },

  // Chart labels
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4
  },

  chartLabel: {
    fontSize: 10,
    color: "#bbb"
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%"
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16
  },

  modalIcon: {
    fontSize: 40
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222"
  },

  modalCategory: {
    fontSize: 13,
    color: "#999",
    textTransform: "capitalize"
  },

  modalPriceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20
  },

  modalPrice: {
    fontSize: 28,
    fontWeight: "800",
    color: "#222"
  },

  modalChangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },

  chartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555",
    marginBottom: 10
  },

  chartContainer: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },

  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 12,
    alignItems: "center"
  },

  statBoxLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4
  },

  statBoxValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5"
  },

  historyDay: {
    flex: 1,
    fontSize: 13,
    color: "#888"
  },

  historyPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginRight: 10
  },

  historyChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    width: 50
  }
});
