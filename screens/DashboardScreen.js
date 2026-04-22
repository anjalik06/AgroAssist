import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import Svg, { Circle } from "react-native-svg";
import { getToken, clearAuth } from "../services/authStorage";
import { API_BASE_URL } from "@env";
import { useFocusEffect } from "@react-navigation/native";

const CROP_CYCLES = {
  Tomato: { totalDays: 90, stages: [{ name: "Germination", max: 10 }, { name: "Seedling", max: 25 }, { name: "Vegetative", max: 45 }, { name: "Flowering", max: 65 }, { name: "Fruiting", max: 80 }, { name: "Harvest", max: 90 }] },
  Onion: { totalDays: 120, stages: [{ name: "Germination", max: 12 }, { name: "Seedling", max: 30 }, { name: "Vegetative", max: 60 }, { name: "Bulb Formation", max: 90 }, { name: "Maturation", max: 110 }, { name: "Harvest", max: 120 }] },
  Potato: { totalDays: 100, stages: [{ name: "Sprouting", max: 15 }, { name: "Vegetative", max: 35 }, { name: "Tuber Initiation", max: 55 }, { name: "Tuber Bulking", max: 80 }, { name: "Maturation", max: 95 }, { name: "Harvest", max: 100 }] },
  Rice: { totalDays: 130, stages: [{ name: "Germination", max: 10 }, { name: "Seedling", max: 25 }, { name: "Tillering", max: 55 }, { name: "Panicle Init.", max: 80 }, { name: "Flowering", max: 100 }, { name: "Harvest", max: 130 }] },
  Banana: { totalDays: 300, stages: [{ name: "Establishment", max: 60 }, { name: "Vegetative", max: 150 }, { name: "Flowering", max: 210 }, { name: "Fruiting", max: 270 }, { name: "Maturation", max: 290 }, { name: "Harvest", max: 300 }] },
  Carrot: { totalDays: 80, stages: [{ name: "Germination", max: 10 }, { name: "Seedling", max: 20 }, { name: "Vegetative", max: 45 }, { name: "Root Swelling", max: 65 }, { name: "Maturation", max: 75 }, { name: "Harvest", max: 80 }] },
  Cabbage: { totalDays: 90, stages: [{ name: "Germination", max: 8 }, { name: "Seedling", max: 25 }, { name: "Vegetative", max: 50 }, { name: "Head Formation", max: 75 }, { name: "Maturation", max: 85 }, { name: "Harvest", max: 90 }] },
  Spinach: { totalDays: 45, stages: [{ name: "Germination", max: 7 }, { name: "Seedling", max: 15 }, { name: "Vegetative", max: 30 }, { name: "Maturation", max: 40 }, { name: "Harvest", max: 45 }] },
  Mango: { totalDays: 150, stages: [{ name: "Bud Break", max: 15 }, { name: "Flowering", max: 40 }, { name: "Fruit Set", max: 70 }, { name: "Fruit Dev.", max: 120 }, { name: "Ripening", max: 145 }, { name: "Harvest", max: 150 }] },
  Apple: { totalDays: 180, stages: [{ name: "Dormancy", max: 30 }, { name: "Bud Break", max: 50 }, { name: "Flowering", max: 70 }, { name: "Fruit Set", max: 100 }, { name: "Fruit Dev.", max: 160 }, { name: "Harvest", max: 180 }] },
  Peas: { totalDays: 70, stages: [{ name: "Germination", max: 8 }, { name: "Seedling", max: 20 }, { name: "Vegetative", max: 35 }, { name: "Flowering", max: 50 }, { name: "Pod Fill", max: 65 }, { name: "Harvest", max: 70 }] },
  Brinjal: { totalDays: 85, stages: [{ name: "Germination", max: 10 }, { name: "Seedling", max: 25 }, { name: "Vegetative", max: 45 }, { name: "Flowering", max: 60 }, { name: "Fruiting", max: 80 }, { name: "Harvest", max: 85 }] },
  Okra: { totalDays: 60, stages: [{ name: "Germination", max: 7 }, { name: "Seedling", max: 18 }, { name: "Vegetative", max: 35 }, { name: "Flowering", max: 45 }, { name: "Fruiting", max: 55 }, { name: "Harvest", max: 60 }] }
};

const DEFAULT_CYCLE = { totalDays: 90, stages: [{ name: "Germination", max: 10 }, { name: "Seedling", max: 25 }, { name: "Vegetative", max: 50 }, { name: "Flowering", max: 70 }, { name: "Fruiting", max: 85 }, { name: "Harvest", max: 90 }] };

function getStageAndProgress(name, sowingDate) {
  const info = CROP_CYCLES[name] || DEFAULT_CYCLE;
  const days = Math.max(0, Math.floor((new Date() - new Date(sowingDate)) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, Math.max(0, Math.round((days / info.totalDays) * 100)));

  let stageName = info.stages[0].name;
  for (let i = 0; i < info.stages.length; i++) {
    if (days <= info.stages[i].max) {
      stageName = info.stages[i].name;
      break;
    }
    if (i === info.stages.length - 1) stageName = info.stages[i].name;
  }

  return { stageName, progress };
}

// Circular progress component
const CircleProgress = ({ progress, color, size = 60, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 13, fontWeight: "bold", color: "#333" }}>{progress}%</Text>
      </View>
    </View>
  );
};

const sidebarMenuItems = [
  { id: 1, label: "Dashboard", icon: "home", screen: null, color: "#FFD700" },
  { id: 2, label: "Crop Advice", icon: "leaf", screen: "CropAdvice", color: "#7CB342" },
  { id: 3, label: "My Plants", icon: "flower", screen: "MyPlants", color: "#558B2F" },
  { id: 4, label: "Market Prices", icon: "trending-up", screen: "MarketPrice", color: "#9CCC65" },
  { id: 5, label: "My Store", icon: "storefront", screen: "Market", color: "#FBC02D" },
  { id: 6, label: "Farm Profile", icon: "person-circle", screen: "FarmProfile", color: "#F9A825" }
];

export default function DashboardScreen({ navigation, setIsLogged, setUserRole }) {

  const [farmName, setFarmName] = useState("Farmer");
  const [stats, setStats] = useState({ products: 0, plants: 0, activeProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(1);
  const [weather, setWeather] = useState({
    temp: "--",
    condition: "Loading...",
    humidity: "--",
    wind: "--",
    location: "Current Location"
  });
  const [plantInsights, setPlantInsights] = useState([]);
  const [firstName, setFirstName] = useState("Farmer");

  useEffect(() => {
    fetchWeatherData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchWeatherData = async () => {
    try {
      // Using Open-Meteo (free, no API key needed) for weather data
      // Default to a location - in production this would use user's location
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia/Kolkata"
      );
      const data = await response.json();

      if (data.current) {
        const weatherConditions = {
          0: "Clear Sky",
          1: "Mainly Clear",
          2: "Partly Cloudy",
          3: "Overcast",
          45: "Foggy",
          48: "Foggy",
          51: "Light Drizzle",
          61: "Rain",
          80: "Heavy Rain",
          99: "Thunderstorm"
        };

        const condition = weatherConditions[data.current.weather_code] || "Clear";

        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition: condition,
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          location: "Bangalore, Karnataka"
        });
      }
    } catch (err) {
      console.log("Weather fetch error:", err);
      // Keep default values on error
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const [userRes, productsRes, plantsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/products/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/plants/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const userData = await userRes.json();
      const productsData = await productsRes.json();
      const plantsData = await plantsRes.json();

      if (userData.success && userData.user) {
        const name = userData.user.farmName ||
          `${userData.user.firstName || ""} ${userData.user.lastName || ""}`.trim() ||
          "Farmer";
        setFarmName(name);
        setFirstName(userData.user.firstName || "Farmer");
        setUserPhone(userData.user.phone || "");
      }

      if (productsData.success) {
        const products = productsData.products;
        setStats(prev => ({
          ...prev,
          products: products.length,
          activeProducts: products.filter(p => p.isActive).length
        }));
      }

      if (plantsData.success && plantsData.plants) {
        const plants = Array.isArray(plantsData.plants) ? plantsData.plants : [];
        setStats(prev => ({ ...prev, plants: plants.length }));

        const stageMessages = {
          "Germination": "just sprouted - keep soil moist",
          "Sprouting": "just sprouted - keep soil moist",
          "Seedling": "growing steadily - protect young leaves",
          "Vegetative": "growing leaves rapidly",
          "Tillering": "building tillers strongly",
          "Panicle Init.": "forming panicles now",
          "Bulb Formation": "bulb size is increasing",
          "Tuber Initiation": "starting tuber development",
          "Tuber Bulking": "bulking stage - critical irrigation phase",
          "Flowering": "in bloom - watch for pests",
          "Fruiting": "fruit set underway",
          "Maturation": "almost ready to harvest",
          "Harvest": "ready to harvest"
        };

        const insights = plants.slice(0, 2).map((plant, idx) => {
          const { stageName, progress } = getStageAndProgress(plant.name, plant.sowingDate);

          return {
            id: plant._id || idx,
            name: plant.name || `Plant ${idx + 1}`,
            stage: stageName,
            progress,
            stageMsg: stageMessages[stageName] || "tracking growth progress"
          };
        });
        setPlantInsights(insights);
      } else {
        console.log("Plants API response:", plantsData);
      }
    } catch (err) {
      console.log("Dashboard fetch error:", err);
    }
    setLoading(false);
  };

  const handleMenuPress = (menuItem) => {
    setActiveMenuId(menuItem.id);
    if (menuItem.screen) {
      navigation.navigate(menuItem.screen);
    }
    setSidebarVisible(false);
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

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      {/* Sidebar Header */}
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarAvatar}>
          <Ionicons name="person" size={32} color="#fff" />
        </View>
        <View style={styles.sidebarUserInfo}>
          <Text style={styles.sidebarUserName} numberOfLines={1}>{farmName}</Text>
          <Text style={styles.sidebarPhone}>📱 {userPhone.slice(-4)}</Text>
        </View>
      </View>

      <View style={styles.sidebarDivider} />

      {/* Menu Items */}
      <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
        {sidebarMenuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.sidebarMenuItem,
              activeMenuId === item.id && styles.sidebarMenuItemActive
            ]}
            onPress={() => handleMenuPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={18} color="#fff" />
            </View>
            <Text style={[
              styles.sidebarMenuLabel,
              activeMenuId === item.id && styles.sidebarMenuLabelActive
            ]}>
              {item.label}
            </Text>
            {activeMenuId === item.id && (
              <View style={styles.menuActiveIndicator} />
            )}
          </TouchableOpacity>
        ))}

        {/* Quick Stats in Sidebar */}
        <View style={styles.sidebarStatsSection}>
          <Text style={styles.sidebarStatsTitle}>Farm Overview</Text>

          <View style={styles.sidebarStatItem}>
            <View style={[styles.statIconSmall, { backgroundColor: "#FBC02D" }]}>
              <Ionicons name="cube" size={16} color="#fff" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Products</Text>
              <Text style={styles.statValueSmall}>{stats.activeProducts}/{stats.products}</Text>
            </View>
          </View>

          <View style={styles.sidebarStatItem}>
            <View style={[styles.statIconSmall, { backgroundColor: "#7CB342" }]}>
              <Ionicons name="leaf" size={16} color="#fff" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statLabel}>Plants</Text>
              <Text style={styles.statValueSmall}>{stats.plants}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sidebar Footer */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.sidebarVersion}>v1.0.0</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <LottieView
          source={require("../assets/lottie/loading.json")}
          autoPlay
          loop
          style={{ width: 100, height: 100 }}
        />
        <Text style={{ color: "#666", marginTop: 12, fontSize: 14 }}>Loading your farm...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setSidebarVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.sidebarModalContainer}>
            {renderSidebar()}
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>

        {/* ===== HEADER WITH LOGO ===== */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.menuToggle}
            onPress={() => setSidebarVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={26} color="#7CB342" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={22} color="#7CB342" />
            <Text style={styles.logoText}>Agro</Text>
            <Text style={styles.logoAccent}>Assist</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("FarmProfile")} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={28} color="#7CB342" />
          </TouchableOpacity>
        </View>

        {/* ===== GREETING SECTION ===== */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingTime}>Good Afternoon! 🌅</Text>
            <Text style={styles.greetingName}>Welcome back, {firstName}!</Text>
          </View>
          <View style={styles.greetingEmoji}>
            <LottieView
              source={require("../assets/lottie/farmer-wave.json")}
              autoPlay
              loop
              style={{ width: 60, height: 60 }}
            />
          </View>
        </View>

        {/* ===== QUICK ACCESS BUTTONS ===== */}
        <View style={styles.quickAccessSection}>
          <TouchableOpacity
            style={[styles.quickAccessBtn, { backgroundColor: "#7CB342" }]}
            onPress={() => {
              setActiveMenuId(2);
              navigation.navigate("CropAdvice");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.quickBtnLottie}>
              <LottieView
                source={require("../assets/lottie/crop.json")}
                autoPlay
                loop
                style={{ width: 32, height: 32 }}
              />
            </View>
            <View style={styles.quickBtnContent}>
              <Text style={styles.quickBtnTitle}>Crop Advice</Text>
              <Text style={styles.quickBtnSubtext}>AI Recommendations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAccessBtn, { backgroundColor: "#558B2F" }]}
            onPress={() => {
              setActiveMenuId(3);
              navigation.navigate("MyPlants");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.quickBtnLottie}>
              <LottieView
                source={require("../assets/lottie/plant.json")}
                autoPlay
                loop
                style={{ width: 32, height: 32 }}
              />
            </View>
            <View style={styles.quickBtnContent}>
              <Text style={styles.quickBtnTitle}>My Plants</Text>
              <Text style={styles.quickBtnSubtext}>{stats.plants} plants tracked</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ===== WEATHER & DATE CARD ===== */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherTop}>
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
              <Text style={styles.weatherCondition}>{weather.condition}</Text>
              <Text style={styles.weatherLocation}>📍 {weather.location}</Text>
            </View>
            <View style={styles.weatherIconBox}>
              {weather.condition.includes("Rain") ? (
                <Ionicons name="rainy" size={48} color="#4DB8E8" />
              ) : weather.condition.includes("Cloud") ? (
                <Ionicons name="cloudy" size={48} color="#B0B0B0" />
              ) : (
                <Ionicons name="sunny" size={48} color="#FFD700" />
              )}
            </View>
          </View>

          <View style={styles.weatherDivider} />

          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetail}>
              <Ionicons name="water" size={20} color="#00BCD4" />
              <View>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </View>
            </View>
            <View style={styles.weatherDetail}>
              <Ionicons name="wind" size={20} color="#FF9800" />
              <View>
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>{weather.wind} km/h</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ===== PLANT PROGRESS CIRCLES ===== */}
        <View style={styles.updatesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌱 Plant Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MyPlants")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {plantInsights.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.circleScroll}>
                {plantInsights.map((insight) => (
                  <View key={insight.id} style={styles.circleItem}>
                    <CircleProgress
                      progress={insight.progress}
                      color={getProgressColor(insight.progress)}
                    />
                    <Text style={styles.circleName} numberOfLines={1}>{insight.name}</Text>
                    <Text style={styles.circleStage}>{insight.stage}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Quick plant insight tip */}
              <View style={styles.plantTipCard}>
                <Ionicons name="leaf" size={16} color="#7CB342" />
                <Text style={styles.plantTipText}>
                  <Text style={{ fontWeight: "700" }}>{plantInsights[0].name}</Text>
                  {" "}{plantInsights[0].stageMsg}
                  {plantInsights.length > 1 && (
                    <>
                      {" · "}
                      <Text style={{ fontWeight: "700" }}>{plantInsights[1].name}</Text>
                      {" "}{plantInsights[1].stageMsg}
                    </>
                  )}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.compactEmptyCard}>
              <LottieView
                source={require("../assets/lottie/plant.json")}
                autoPlay
                loop
                style={{ width: 50, height: 50, opacity: 0.4 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyUpdateText}>No plants tracked yet</Text>
                <TouchableOpacity onPress={() => navigation.navigate("AddPlant")}>
                  <Text style={styles.addPlantLink}>+ Add your first plant</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ===== QUICK INSIGHTS ===== */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>💡 Quick Insights</Text>

          <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: "#FFF9C4" }]}>
              <Ionicons name="sunny" size={24} color="#F9A825" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>
                {weather.condition.includes("Rain") ? "Rainy Today" : "Perfect Weather"}
              </Text>
              <Text style={styles.insightText}>
                {weather.condition.includes("Rain")
                  ? "Reduce watering, cover sensitive crops"
                  : "Ideal for watering and crop care"}
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: "#F1F8E9" }]}>
              <Ionicons name="checkmark-circle" size={24} color="#7CB342" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{stats.products} Products Live</Text>
              <Text style={styles.insightText}>Your farm store is active and growing!</Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={[styles.insightIconBox, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="bulb" size={24} color="#558B2F" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Monitor Market Prices</Text>
              <Text style={styles.insightText}>Check trending crops for better earnings</Text>
            </View>
          </View>
        </View>

        {/* ===== BOTTOM SPACING ===== */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </View>
  );
}

// Helper functions
const getStageColor = (stage) => {
  const colors = {
    "Seedling": "#FFD700",
    "Vegetative": "#9CCC65",
    "Pre-Flowering": "#7CB342",
    "Flowering": "#558B2F",
    "Harvest": "#F9A825"
  };
  return colors[stage] || "#FFD700";
};

const getProgressColor = (progress) => {
  if (progress < 25) return "#FFD700";
  if (progress < 50) return "#9CCC65";
  if (progress < 75) return "#7CB342";
  return "#558B2F";
};

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFACD"
  },

  mainContent: {
    flex: 1,
    backgroundColor: "#FFFACD"
  },

  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.5)"
  },

  backdrop: {
    flex: 1
  },

  sidebarModalContainer: {
    width: 280,
    backgroundColor: "#fff",
    height: "100%"
  },

  // ===== SIDEBAR STYLES =====
  sidebar: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20
  },

  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  sidebarAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#7CB342",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },

  sidebarUserInfo: {
    flex: 1
  },

  sidebarUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222"
  },

  sidebarPhone: {
    fontSize: 12,
    color: "#999",
    marginTop: 3
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12
  },

  sidebarMenu: {
    flex: 1,
    paddingHorizontal: 8
  },

  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 12,
    gap: 12,
    position: "relative"
  },

  sidebarMenuItemActive: {
    backgroundColor: "#fff3e0"
  },

  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },

  sidebarMenuLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1
  },

  sidebarMenuLabelActive: {
    color: "#7CB342",
    fontWeight: "bold"
  },

  menuActiveIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: "#7CB342",
    marginLeft: 8
  },

  sidebarStatsSection: {
    marginTop: 20,
    marginHorizontal: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0"
  },

  sidebarStatsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7CB342",
    marginBottom: 12,
    textTransform: "uppercase"
  },

  sidebarStatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10
  },

  statIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },

  statTextContainer: {
    flex: 1
  },

  statLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500"
  },

  statValueSmall: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F1F8E9",
    borderRadius: 10,
    marginBottom: 12
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7CB342"
  },

  sidebarVersion: {
    fontSize: 11,
    color: "#ccc",
    textAlign: "center"
  },

  // ===== MAIN CONTENT =====
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8
  },

  menuToggle: {
    padding: 8,
    marginLeft: -8
  },

  logoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },

  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333"
  },

  logoAccent: {
    fontSize: 20,
    fontWeight: "800",
    color: "#7CB342"
  },

  // Greeting Section
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16
  },

  greetingTime: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4
  },

  greetingName: {
    fontSize: 14,
    color: "#666"
  },

  greetingEmoji: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#C8E6C9",
    alignItems: "center",
    justifyContent: "center"
  },

  emojiText: {
    fontSize: 32
  },

  // Quick Access Section
  quickAccessSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20
  },

  quickAccessBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 12
  },

  quickBtnLottie: {
    width: 32,
    height: 32
  },

  quickBtnContent: {
    flex: 1
  },

  quickBtnTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2
  },

  quickBtnSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)"
  },

  // Weather Card
  weatherCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6
  },

  weatherTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },

  weatherInfo: {
    flex: 1
  },

  weatherTemp: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#333"
  },

  weatherCondition: {
    fontSize: 16,
    color: "#666",
    marginTop: 4
  },

  weatherLocation: {
    fontSize: 12,
    color: "#999",
    marginTop: 4
  },

  weatherIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#F1F8E9",
    alignItems: "center",
    justifyContent: "center"
  },

  weatherDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 14
  },

  weatherDetails: {
    flexDirection: "row",
    gap: 20
  },

  weatherDetail: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },

  detailLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500"
  },

  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2
  },

  // Updates Section
  updatesSection: {
    paddingHorizontal: 16,
    marginBottom: 20
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },

  seeAllText: {
    fontSize: 13,
    color: "#7CB342",
    fontWeight: "600"
  },

  circleScroll: {
    flexDirection: "row"
  },

  circleItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80
  },

  circleName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginTop: 6,
    textAlign: "center"
  },

  circleStage: {
    fontSize: 10,
    color: "#999",
    marginTop: 2
  },

  plantTipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F1F8E9",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8
  },

  plantTipText: {
    flex: 1,
    fontSize: 12,
    color: "#555",
    lineHeight: 18
  },

  compactEmptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },

  emptyUpdateText: {
    fontSize: 13,
    color: "#aaa"
  },

  addPlantLink: {
    fontSize: 13,
    color: "#7CB342",
    fontWeight: "600",
    marginTop: 4
  },

  // Insights Section
  insightsSection: {
    paddingHorizontal: 16,
    marginBottom: 28
  },

  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    gap: 12
  },

  insightIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },

  insightContent: {
    flex: 1
  },

  insightTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333"
  },

  insightText: {
    fontSize: 11,
    color: "#999",
    marginTop: 2
  }

});

