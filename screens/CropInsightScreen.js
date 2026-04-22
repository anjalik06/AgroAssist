import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@env";

const { width } = Dimensions.get("window");

export default function CropInsightScreen({ navigation, route }) {

  const { crop, location } = route.params;
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    fetchInsight();
  }, []);

  const fetchInsight = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/crop/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: crop.name,
          location
        })
      });

      const result = await response.json();

      if (result.success) {
        setInsight(result.data);
      } else {
        alert(result.message || "No insight data available");
      }
    } catch (error) {
      console.log(error);
      alert("Failed to fetch crop insight");
    }
    setLoading(false);
  };

  const getTrendColor = (label) => {
    if (label === "Hot") return "#e53935";
    if (label === "Rising") return "#ff9800";
    if (label === "Stable") return "#4caf50";
    return "#9e9e9e";
  };

  const getTrendIcon = (label) => {
    if (label === "Hot") return "flame";
    if (label === "Rising") return "trending-up";
    if (label === "Stable") return "remove-outline";
    return "trending-down";
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#e53935";
    if (score >= 50) return "#ff9800";
    if (score >= 25) return "#4caf50";
    return "#9e9e9e";
  };

  const maxPrice = insight ? Math.max(...insight.price_history.map(p => p.avg_price)) : 0;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Insight</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Analyzing market data for {crop.name}...</Text>
          <Text style={styles.loadingSubtext}>Powered by AI</Text>
        </View>
      ) : insight ? (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* CROP HERO CARD */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroName}>{insight.crop_name}</Text>
                <Text style={styles.heroCategory}>{crop.category}</Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: getTrendColor(insight.trending_label) }]}>
                <Ionicons name={getTrendIcon(insight.trending_label)} size={14} color="#fff" />
                <Text style={styles.trendBadgeText}>{insight.trending_label}</Text>
              </View>
            </View>

            {/* Trending Score Bar */}
            <View style={styles.scoreSection}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreLabel}>Trending Score</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(insight.trending_score) }]}>
                  {insight.trending_score}/100
                </Text>
              </View>
              <View style={styles.scoreBarBg}>
                <View style={[styles.scoreBarFill, {
                  width: `${insight.trending_score}%`,
                  backgroundColor: getScoreColor(insight.trending_score)
                }]} />
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={18} color="#4caf50" />
                <Text style={styles.statValue}>{insight.growth_duration}</Text>
                <Text style={styles.statLabel}>Growth</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={18} color="#ff9800" />
                <Text style={styles.statValue}>{insight.best_months_to_sow}</Text>
                <Text style={styles.statLabel}>Best Sowing</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="bar-chart-outline" size={18} color="#2196f3" />
                <Text style={styles.statValue}>{insight.local_demand_rank}/10</Text>
                <Text style={styles.statLabel}>Local Demand</Text>
              </View>
            </View>
          </View>

          {/* MARKET SUMMARY */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>Market Summary</Text>
            </View>
            <Text style={styles.summaryText}>{insight.market_summary}</Text>

            <View style={[styles.demandChip, {
              backgroundColor: insight.demand_trend === "Increasing" ? "#e8f5e9" :
                insight.demand_trend === "Stable" ? "#fff8e1" : "#ffebee"
            }]}>
              <Ionicons
                name={insight.demand_trend === "Increasing" ? "arrow-up-circle" :
                  insight.demand_trend === "Stable" ? "remove-circle" : "arrow-down-circle"}
                size={16}
                color={insight.demand_trend === "Increasing" ? "#2e7d32" :
                  insight.demand_trend === "Stable" ? "#f57f17" : "#c62828"}
              />
              <Text style={[styles.demandChipText, {
                color: insight.demand_trend === "Increasing" ? "#2e7d32" :
                  insight.demand_trend === "Stable" ? "#f57f17" : "#c62828"
              }]}>
                Demand: {insight.demand_trend}
              </Text>
            </View>
          </View>

          {/* PRICE HISTORY CHART */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>Price History (₹/quintal)</Text>
            </View>

            <View style={styles.chartContainer}>
              {insight.price_history.map((item, index) => {
                const barHeight = maxPrice > 0 ? (item.avg_price / maxPrice) * 120 : 0;
                const isLatest = index === insight.price_history.length - 1;

                return (
                  <View key={index} style={styles.chartBar}>
                    <Text style={[styles.barValue, isLatest && styles.barValueHighlight]}>
                      ₹{item.avg_price}
                    </Text>
                    <View style={[styles.bar, {
                      height: barHeight,
                      backgroundColor: isLatest ? "#2e7d32" : "#a5d6a7"
                    }]} />
                    <Text style={[styles.barLabel, isLatest && styles.barLabelHighlight]}>
                      {item.year}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* PROFIT POTENTIAL */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash-outline" size={20} color="#2e7d32" />
              <Text style={styles.sectionTitle}>Profit Potential (per acre)</Text>
            </View>

            <View style={styles.profitGrid}>

              <View style={styles.profitItem}>
                <View style={[styles.profitIcon, { backgroundColor: "#fff3e0" }]}>
                  <Ionicons name="wallet-outline" size={20} color="#ff9800" />
                </View>
                <Text style={styles.profitLabel}>Investment</Text>
                <Text style={styles.profitValue}>₹{insight.profit_potential.investment_per_acre?.toLocaleString()}</Text>
              </View>

              <View style={styles.profitItem}>
                <View style={[styles.profitIcon, { backgroundColor: "#e3f2fd" }]}>
                  <Ionicons name="leaf-outline" size={20} color="#2196f3" />
                </View>
                <Text style={styles.profitLabel}>Yield</Text>
                <Text style={styles.profitValue}>{insight.profit_potential.expected_yield_per_acre}</Text>
              </View>

              <View style={styles.profitItem}>
                <View style={[styles.profitIcon, { backgroundColor: "#e8f5e9" }]}>
                  <Ionicons name="card-outline" size={20} color="#4caf50" />
                </View>
                <Text style={styles.profitLabel}>Revenue</Text>
                <Text style={styles.profitValue}>₹{insight.profit_potential.expected_revenue_per_acre?.toLocaleString()}</Text>
              </View>

              <View style={styles.profitItem}>
                <View style={[styles.profitIcon, { backgroundColor: "#fce4ec" }]}>
                  <Ionicons name="trending-up" size={20} color="#e53935" />
                </View>
                <Text style={styles.profitLabel}>Profit</Text>
                <Text style={[styles.profitValue, { color: "#2e7d32" }]}>
                  ₹{insight.profit_potential.estimated_profit_per_acre?.toLocaleString()}
                </Text>
              </View>

            </View>

            {/* ROI Badge */}
            <View style={styles.roiBadge}>
              <Ionicons name="rocket-outline" size={18} color="#fff" />
              <Text style={styles.roiText}>
                Expected ROI: {insight.profit_potential.roi_percentage}%
              </Text>
            </View>
          </View>

          {/* BENEFITS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#4caf50" />
              <Text style={styles.sectionTitle}>Benefits</Text>
            </View>
            {insight.benefits.map((benefit, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.benefitDot} />
                <Text style={styles.listText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* RISKS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={20} color="#ff9800" />
              <Text style={styles.sectionTitle}>Risks to Consider</Text>
            </View>
            {insight.risks.map((risk, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.riskDot} />
                <Text style={styles.listText}>{risk}</Text>
              </View>
            ))}
          </View>

          {/* RECOMMENDATION */}
          <View style={styles.recommendCard}>
            <Ionicons name="bulb-outline" size={22} color="#f57f17" />
            <Text style={styles.recommendTitle}>AI Recommendation</Text>
            <Text style={styles.recommendText}>{insight.recommendation_reason}</Text>
          </View>

          <View style={{ height: 30 }} />

        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
          <Text style={styles.loadingText}>Failed to load insights</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchInsight}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff"
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center"
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333"
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    textAlign: "center"
  },

  loadingSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: "#aaa"
  },

  // Hero card
  heroCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e8f5e9"
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },

  heroName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222"
  },

  heroCategory: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
    textTransform: "capitalize"
  },

  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5
  },

  trendBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold"
  },

  scoreSection: {
    marginBottom: 18
  },

  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },

  scoreLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600"
  },

  scoreValue: {
    fontSize: 14,
    fontWeight: "bold"
  },

  scoreBarBg: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden"
  },

  scoreBarFill: {
    height: 8,
    borderRadius: 4
  },

  quickStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fafff5",
    borderRadius: 14,
    paddingVertical: 14
  },

  statItem: {
    alignItems: "center",
    flex: 1
  },

  statValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginTop: 6,
    textAlign: "center"
  },

  statLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2
  },

  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#e0e0e0"
  },

  // Section cards
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 18
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },

  summaryText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 12
  },

  demandChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },

  demandChipText: {
    fontSize: 13,
    fontWeight: "600"
  },

  // Chart
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 170,
    paddingTop: 20
  },

  chartBar: {
    alignItems: "center",
    flex: 1
  },

  barValue: {
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
    fontWeight: "600"
  },

  barValueHighlight: {
    color: "#2e7d32",
    fontWeight: "bold"
  },

  bar: {
    width: 32,
    borderRadius: 6,
    minHeight: 8
  },

  barLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 8
  },

  barLabelHighlight: {
    color: "#2e7d32",
    fontWeight: "bold"
  },

  // Profit
  profitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  profitItem: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10
  },

  profitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },

  profitLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4
  },

  profitValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center"
  },

  roiBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    gap: 8
  },

  roiText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold"
  },

  // Lists
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 10
  },

  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
    marginTop: 6
  },

  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff9800",
    marginTop: 6
  },

  listText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20
  },

  // Recommendation
  recommendCard: {
    backgroundColor: "#fffde7",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff9c4"
  },

  recommendTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#f57f17",
    marginTop: 8,
    marginBottom: 8
  },

  recommendText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    textAlign: "center"
  },

  retryBtn: {
    marginTop: 20,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10
  },

  retryText: {
    color: "#fff",
    fontWeight: "bold"
  }

});
