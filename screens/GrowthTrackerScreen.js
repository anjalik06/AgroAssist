import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { LineChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { Circle } from "react-native-svg";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";
import { CROP_DATA as SHARED_CROP_DATA, DEFAULT_CROP as SHARED_DEFAULT_CROP } from "../constants/cropCycles";


const screenWidth = Dimensions.get("window").width - 40;

// Legacy per-crop blocks — kept only for `tips` content.
// totalDays / stages / growthCurve are always read from SHARED_CROP_DATA so
// MyPlantsScreen and GrowthTrackerScreen stay in sync.
const CROP_DATA = {
  Tomato: {
    totalDays: 90,
    stages: [
      { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [26, 45], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [46, 65], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruiting", dayRange: [66, 80], icon: "\uD83C\uDF43", color: "#FF7043" },
      { name: "Harvest", dayRange: [81, 90], icon: "\uD83E\uDDFA", color: "#8D6E63" },
    ],
    tips: {
      Germination: {
        fertilizer: "Apply DAP (Di-Ammonium Phosphate) at 2g/L for root development",
        water: "Keep soil consistently moist, water twice daily with fine spray",
        pest: "Watch for damping-off disease. Use fungicide-treated seeds",
        action: "Maintain 25-30°C temperature. Use seed trays with well-drained soil mix"
      },
      Seedling: {
        fertilizer: "Start 19:19:19 NPK foliar spray at 3g/L every 7 days",
        water: "Water once daily in morning. Avoid waterlogging",
        pest: "Check for leaf miners and aphids. Use neem oil spray if spotted",
        action: "Transplant to main field when seedlings have 4-5 true leaves (around day 20-25)"
      },
      Vegetative: {
        fertilizer: "Apply Urea 46:0:0 at 5g per plant. Side dress with compost",
        water: "Drip irrigation every 2 days. Mulch to retain moisture",
        pest: "Scout for whiteflies and early blight. Install yellow sticky traps",
        action: "Stake plants for support. Prune suckers below first flower cluster"
      },
      Flowering: {
        fertilizer: "Switch to high-potassium feed (0:0:50 MOP). Apply calcium to prevent blossom end rot",
        water: "Consistent watering critical - irregular water causes flower drop",
        pest: "Monitor for fruit borers and leaf curl virus. Spray Imidacloprid if needed",
        action: "Tap plants gently to aid pollination. Maintain 20-25°C for best fruit set"
      },
      Fruiting: {
        fertilizer: "Continue potassium feed. Foliar spray of calcium + boron fortnightly",
        water: "Reduce watering slightly to improve fruit sweetness and prevent cracking",
        pest: "Check for fruit rot and late blight. Remove infected fruits immediately",
        action: "Support heavy branches. Remove lower yellowing leaves for air circulation"
      },
      Harvest: {
        fertilizer: "Stop all fertilizer application 10 days before harvest",
        water: "Reduce irrigation. Slight stress improves flavor",
        pest: "Watch for post-harvest rot. Harvest in dry conditions",
        action: "Pick when fruits are firm and fully colored. Harvest every 2-3 days"
      }
    },
    growthCurve: [0, 5, 12, 25, 40, 55, 70, 85, 95, 100]
  },
  Onion: {
    totalDays: 120,
    stages: [
      { name: "Germination", dayRange: [0, 12], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [13, 30], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [31, 60], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Bulb Formation", dayRange: [61, 90], icon: "\uD83E\uDDC5", color: "#FFB74D" },
      { name: "Maturation", dayRange: [91, 110], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [111, 120], icon: "\uD83E\uDDFA", color: "#8D6E63" },
    ],
    tips: {
      Germination: {
        fertilizer: "Apply well-decomposed FYM at 25 tonnes/hectare before sowing",
        water: "Light irrigation immediately after sowing. Keep beds moist",
        pest: "Treat seeds with Thiram 2g/kg to prevent damping off",
        action: "Sow seeds 1cm deep in raised nursery beds. Space rows 10cm apart"
      },
      Seedling: {
        fertilizer: "Apply NPK 19:19:19 at 5g/L as foliar spray weekly",
        water: "Water every 2-3 days. Avoid overwatering to prevent root rot",
        pest: "Monitor for thrips - silvery streaks on leaves indicate infestation",
        action: "Transplant at 45-50 days when seedlings are pencil-thick with 3-4 leaves"
      },
      Vegetative: {
        fertilizer: "Side dress with Urea 46:0:0 at 30 days after transplanting",
        water: "Irrigate every 5-7 days. Onions need consistent but not excess moisture",
        pest: "Apply Fipronil for thrips control. Watch for purple blotch fungus",
        action: "Keep field weed-free - onions compete poorly with weeds. Mulch between rows"
      },
      "Bulb Formation": {
        fertilizer: "Apply MOP (Muriate of Potash) at 50kg/hectare for bulb development",
        water: "Maintain regular irrigation - stress during bulbing reduces yield by 20-30%",
        pest: "Watch for Stemphylium blight. Spray Mancozeb if symptoms appear",
        action: "Do NOT earth up - keep bulbs exposed to light for proper formation"
      },
      Maturation: {
        fertilizer: "Stop nitrogen fertilizer. Excess nitrogen delays maturity",
        water: "Reduce irrigation frequency. Stop watering 10 days before harvest",
        pest: "Check for storage rots. Remove damaged bulbs from field",
        action: "Neck fall (tops drying and falling) indicates maturity. Wait for 50-75% neck fall"
      },
      Harvest: {
        fertilizer: "No fertilizer needed",
        water: "No irrigation - field should be dry",
        pest: "Cure bulbs in shade for 3-5 days to prevent storage diseases",
        action: "Pull bulbs when tops are 80% dry. Cure in ventilated shade before storage"
      }
    },
    growthCurve: [0, 3, 8, 15, 25, 40, 55, 70, 85, 100]
  },
  Potato: {
    totalDays: 100,
    stages: [
      { name: "Sprouting", dayRange: [0, 15], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Vegetative", dayRange: [16, 35], icon: "\uD83E\uDEB4", color: "#81C784" },
      { name: "Tuber Initiation", dayRange: [36, 55], icon: "\uD83E\uDD54", color: "#FFB74D" },
      { name: "Tuber Bulking", dayRange: [56, 80], icon: "\uD83E\uDD54", color: "#FF8A65" },
      { name: "Maturation", dayRange: [81, 95], icon: "\uD83C\uDF3E", color: "#A1887F" },
      { name: "Harvest", dayRange: [96, 100], icon: "\uD83E\uDDFA", color: "#8D6E63" },
    ],
    tips: {
      Sprouting: {
        fertilizer: "Apply FYM + SSP (Single Super Phosphate) at planting time",
        water: "Light irrigation after planting. Avoid waterlogging",
        pest: "Use certified disease-free seed potatoes. Treat cuts with fungicide",
        action: "Plant sprouted tubers 15-20cm apart, 5-7cm deep in ridges"
      },
      Vegetative: {
        fertilizer: "Top dress with Urea at 20 days. Apply NPK 12:32:16 as basal",
        water: "Irrigate every 7-10 days depending on soil type",
        pest: "Early blight may appear - spray Mancozeb preventively",
        action: "Earth up (hill soil around stems) at 25-30 days to cover emerging tubers"
      },
      "Tuber Initiation": {
        fertilizer: "Apply MOP for potassium boost. Foliar spray micronutrients",
        water: "Critical period - maintain consistent moisture. No water stress",
        pest: "Late blight is the biggest threat. Spray Metalaxyl + Mancozeb",
        action: "Second earthing up if needed. Keep tubers completely covered by soil"
      },
      "Tuber Bulking": {
        fertilizer: "Potassium-rich fertilizer continues. Foliar calcium spray",
        water: "Most water needed now - irrigate every 5-7 days",
        pest: "Monitor for tuber moth. Maintain soil cover over tubers",
        action: "This is the yield-determining phase. Avoid any plant stress"
      },
      Maturation: {
        fertilizer: "Stop all fertilizer. Allow natural drying",
        water: "Reduce irrigation. Stop 10-15 days before harvest",
        pest: "Cut haulms (stems) 10 days before harvest to toughen skin",
        action: "Vine killing helps tuber skin set for better storage"
      },
      Harvest: {
        fertilizer: "No fertilizer",
        water: "No irrigation - harvest when soil is dry",
        pest: "Handle carefully to avoid bruising. Cure in dark place 10 days",
        action: "Dig carefully with fork. Avoid cuts. Grade and store at 4°C"
      }
    },
    growthCurve: [0, 5, 10, 20, 35, 55, 75, 90, 97, 100]
  },
  Rice: {
    totalDays: 130,
    stages: [
      { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Tillering", dayRange: [26, 55], icon: "\uD83C\uDF3E", color: "#66BB6A" },
      { name: "Panicle Init.", dayRange: [56, 80], icon: "\uD83C\uDF3E", color: "#FFB74D" },
      { name: "Flowering", dayRange: [81, 100], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Harvest", dayRange: [101, 130], icon: "\uD83E\uDDFA", color: "#8D6E63" },
    ],
    tips: {
      Germination: {
        fertilizer: "Apply basal dose: 50% N + full P + 50% K before transplanting",
        water: "Maintain 2-3cm standing water in nursery beds",
        pest: "Seed treatment with Carbendazim 2g/kg prevents blast",
        action: "Soak seeds 24hrs, incubate 48hrs for pre-germination. Sow in wet nursery beds"
      },
      Seedling: {
        fertilizer: "Apply DAP in nursery at 7 days after sowing",
        water: "Maintain thin layer of water. Drain before pulling seedlings",
        pest: "Watch for brown plant hopper in nursery",
        action: "Transplant 21-25 day old seedlings. 2-3 seedlings per hill, 20x15cm spacing"
      },
      Tillering: {
        fertilizer: "First top dress: Urea at 21 DAT. Second at 42 DAT",
        water: "Maintain 5cm standing water. Drain briefly for root aeration",
        pest: "Stem borer and leaf folder are common. Use Chlorantraniliprole",
        action: "Active tillering determines yield. Maintain 25-30 tillers per hill"
      },
      "Panicle Init.": {
        fertilizer: "Apply remaining 25% N + 50% K. Critical nutrient period",
        water: "Do NOT drain fields now. Consistent 5cm water essential",
        pest: "Blast disease on panicle neck is devastating. Spray Tricyclazole",
        action: "Panicle initiation visible when stem internodes elongate"
      },
      Flowering: {
        fertilizer: "Foliar spray of KCl 1% for grain filling",
        water: "Maintain standing water through flowering. Drain gradually after",
        pest: "False smut and sheath blight monitoring needed",
        action: "Protect from birds. Flowering lasts 7-10 days"
      },
      Harvest: {
        fertilizer: "No fertilizer needed",
        water: "Drain field 15-20 days before harvest",
        pest: "Watch for grain discoloration and storage pests",
        action: "Harvest when 80% grains are golden. Moisture should be 20-22% at cutting"
      }
    },
    growthCurve: [0, 3, 8, 18, 30, 45, 60, 80, 92, 100]
  },
  Banana: {
    totalDays: 300,
    stages: [
      { name: "Establishment", dayRange: [0, 60], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Vegetative", dayRange: [61, 150], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [151, 210], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruiting", dayRange: [211, 270], icon: "\uD83C\uDF43", color: "#FFB74D" },
      { name: "Maturation", dayRange: [271, 290], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [291, 300], icon: "\uD83E\uDDFA", color: "#8D6E63" },
    ],
    tips: {
      Establishment: {
        fertilizer: "Apply 10kg FYM + 250g Neem Cake per pit at planting",
        water: "Irrigate immediately after planting. Water every 3-4 days",
        pest: "Rhizome weevil treatment with Chlorpyriphos dip before planting",
        action: "Plant suckers in 60x60x60cm pits. Space 1.8m x 1.8m. Mulch heavily"
      },
      Vegetative: {
        fertilizer: "Split NPK: Apply Urea + MOP monthly. Total 200g N per plant over cycle",
        water: "Drip irrigation ideal - 10-15 litres per plant per day",
        pest: "Sigatoka leaf spot - spray Propiconazole. Remove affected leaves",
        action: "Desuckering - keep only one sword sucker per plant. Earthing up at 3 months"
      },
      Flowering: {
        fertilizer: "Apply Sulphate of Potash 200g per plant. Foliar micronutrients",
        water: "Critical water need - never let plant stress during bunch emergence",
        pest: "Thrips damage flower. Spray during evening. Remove male bud after last hand opens",
        action: "Prop plants with bamboo support as bunch weight increases"
      },
      Fruiting: {
        fertilizer: "Potassium continues. Banana needs most K during fruit filling",
        water: "Maintain consistent irrigation. Bunch takes 90-120 days to mature",
        pest: "Bunch covers with perforated polythene protect from pests and sunburn",
        action: "Remove dry leaves. Keep 10-12 healthy leaves for proper filling"
      },
      Maturation: {
        fertilizer: "Stop fertilizer application",
        water: "Reduce irrigation slightly",
        pest: "Watch for crown rot - maintain field hygiene",
        action: "Harvest when fingers are 75% round and light green turning yellow"
      },
      Harvest: {
        fertilizer: "No fertilizer",
        water: "No specific requirement",
        pest: "Ripening room: Ethylene treatment for uniform ripening",
        action: "Cut bunch with 30cm stalk. Ripen in shaded area. Grade for market"
      }
    },
    growthCurve: [0, 2, 5, 10, 20, 35, 50, 70, 90, 100]
  }
};

// Default fallback for unknown crops
const DEFAULT_CROP = {
  totalDays: 90,
  stages: [
    { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
    { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
    { name: "Vegetative", dayRange: [26, 50], icon: "\uD83E\uDEB4", color: "#66BB6A" },
    { name: "Flowering", dayRange: [51, 70], icon: "\uD83C\uDF3C", color: "#FDD835" },
    { name: "Fruiting", dayRange: [71, 85], icon: "\uD83C\uDF43", color: "#FF7043" },
    { name: "Harvest", dayRange: [86, 90], icon: "\uD83E\uDDFA", color: "#8D6E63" },
  ],
  tips: {
    Germination: {
      fertilizer: "Apply phosphorus-rich starter fertilizer at sowing",
      water: "Light watering twice daily. Keep soil moist, not waterlogged",
      pest: "Use treated seeds. Watch for damping-off in wet conditions",
      action: "Sow at recommended depth. Maintain 20-30°C for best germination"
    },
    Seedling: {
      fertilizer: "NPK 19:19:19 foliar spray at 3g/L weekly",
      water: "Water daily in morning. Ensure good drainage",
      pest: "Monitor for aphids and leaf miners. Use neem oil preventively",
      action: "Thin out weak seedlings. Transplant when 4-5 true leaves appear"
    },
    Vegetative: {
      fertilizer: "Side dress with nitrogen (Urea). Apply compost around base",
      water: "Deep irrigation every 2-3 days. Mulch to retain moisture",
      pest: "Scout for caterpillars and fungal spots. Remove affected leaves",
      action: "Weed regularly. Stake tall varieties. Ensure 6+ hours sunlight"
    },
    Flowering: {
      fertilizer: "Switch to potassium-rich feed. Apply calcium for fruit quality",
      water: "Consistent watering critical - avoid stress during flowering",
      pest: "Protect from borers and sucking pests. Avoid broad-spectrum pesticides",
      action: "Assist pollination if needed. Protect from strong winds"
    },
    Fruiting: {
      fertilizer: "Continue potassium. Foliar micronutrients (Zn, B, Ca) fortnightly",
      water: "Regular but reduced watering. Avoid cracking from overwatering",
      pest: "Fruit rot prevention - improve air circulation, remove infected fruits",
      action: "Support heavy branches. Harvest mature fruits promptly"
    },
    Harvest: {
      fertilizer: "Stop fertilizer 7-10 days before harvest",
      water: "Minimal watering to concentrate flavors",
      pest: "Harvest in dry conditions. Cure/store properly to prevent rot",
      action: "Harvest at recommended maturity. Handle gently to avoid bruising"
    }
  },
  growthCurve: [0, 5, 15, 30, 50, 65, 80, 90, 97, 100]
};

// Builds the combined cycle (shared totalDays/stages/growthCurve + local tips)
function resolveCropInfo(cropName) {
  const shared = SHARED_CROP_DATA[cropName] || SHARED_DEFAULT_CROP;
  const localTips = CROP_DATA[cropName]?.tips || DEFAULT_CROP.tips || {};
  return {
    totalDays: shared.totalDays,
    stages: shared.stages,
    growthCurve: shared.growthCurve,
    tips: localTips
  };
}

export default function GrowthTrackerScreen({ route }) {
  const plant = route?.params?.plant;

  const [plantId, setPlantId] = useState(null);
  const [crop, setCrop] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [days, setDays] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [overriddenStage, setOverriddenStage] = useState(null);
  const [cropInfo, setCropInfo] = useState(SHARED_DEFAULT_CROP);

  useEffect(() => {
    if (plant) {
      setPlantId(plant._id);
      setCrop(plant.name);
      setSowingDate(plant.sowingDate);

      const sow = new Date(plant.sowingDate);
      const d = Math.floor((new Date() - sow) / (1000 * 60 * 60 * 24));
      setDays(Math.max(0, d));

      const info = resolveCropInfo(plant.name);
      setCropInfo(info);

      const stage = getStageForDay(d, info.stages);
      setCurrentStage(stage);

      if (plant.overriddenStage) {
        setOverriddenStage(plant.overriddenStage);
      }
    }
  }, []);

  const persistOverride = async (newOverride) => {
    if (!plantId) return;
    try {
      const token = await getToken();
      await fetch(`${API_BASE_URL}/api/plants/${plantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ overriddenStage: newOverride })
      });
    } catch (err) {
      console.log("Persist override error:", err);
    }
  };

  const getStageForDay = (d, stages) => {
    for (const s of stages) {
      if (d >= s.dayRange[0] && d <= s.dayRange[1]) return s.name;
    }
    if (d > stages[stages.length - 1].dayRange[1]) return stages[stages.length - 1].name;
    return stages[0].name;
  };

  const activeStage = overriddenStage || currentStage;
  const activeTips = cropInfo.tips?.[activeStage] || {};
  const activeStageInfo = cropInfo.stages.find((s) => s.name === activeStage);
  const effectiveDays = overriddenStage && activeStageInfo
    ? Math.round((activeStageInfo.dayRange[0] + activeStageInfo.dayRange[1]) / 2)
    : days;

  const getProgress = () => {
    const p = (effectiveDays / cropInfo.totalDays) * 100;
    return Math.min(100, Math.max(0, p));
  };

  const harvestDate = sowingDate
    ? (() => {
        const h = new Date(sowingDate);
        h.setDate(h.getDate() + cropInfo.totalDays);
        return h.toISOString().split("T")[0];
      })()
    : "";

  // Stage correction - does NOT change sowing date
  const handleStageCorrection = (selected) => {
    const next = selected === currentStage ? null : selected;
    setOverriddenStage(next);
    persistOverride(next);

    if (Platform.OS === "web") {
      window.alert(`Stage updated to "${selected}". Tips and progress preview were adjusted.\nNote: Sowing date remains ${sowingDate} (unchanged).`);
    } else {
      Alert.alert(
        "Stage Corrected",
        `Growth stage set to "${selected}".\nSowing date remains ${sowingDate} (unchanged).\nTips and progress preview were updated.`
      );
    }
  };

  // Growth curve chart data
  const totalDays = cropInfo.totalDays;
  const curveRaw = cropInfo.growthCurve; // 10-point reference curve

  // Evenly spaced labels
  const numPoints = curveRaw.length;
  const chartLabels = curveRaw.map((_, i) => String(Math.round((i / (numPoints - 1)) * totalDays)));

  // Find which chart index is closest to the current effective day
  const clampedDay = Math.min(effectiveDays, totalDays);
  const currentDayFraction = clampedDay / totalDays;
  const currentDayIndex = Math.round(currentDayFraction * (numPoints - 1));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <AnimatedCircularProgress
          size={150}
          width={14}
          fill={getProgress()}
          tintColor="#7CB342"
          backgroundColor="#E8F5E9"
          lineCap="round"
        >
          {(fill) => (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.percent}>{Math.round(fill)}%</Text>
              <Text style={styles.percentLabel}>Growth</Text>
            </View>
          )}
        </AnimatedCircularProgress>

        <Text style={styles.cropName}>{crop}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Ionicons name="calendar-outline" size={14} color="#7CB342" />
            <Text style={styles.infoText}>Sowed: {sowingDate}</Text>
          </View>
        </View>

        <View style={[styles.stageBadge, { backgroundColor: cropInfo.stages.find(s => s.name === activeStage)?.color || "#7CB342" }]}>
          <Text style={styles.stageBadgeText}>{activeStage}</Text>
        </View>

        {overriddenStage && (
          <Text style={styles.overrideNote}>
            (Auto-detected: {currentStage} - manually set to {overriddenStage})
          </Text>
        )}

        {harvestDate !== "" && (
          <View style={styles.harvestRow}>
            <Ionicons name="leaf" size={14} color="#7CB342" />
            <Text style={styles.harvestText}>Est. Harvest: {harvestDate}</Text>
          </View>
        )}
      </View>

      {/* Stage Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Crop Stage Timeline</Text>
        <View style={styles.timeline}>
          {cropInfo.stages.map((s, i) => {
            const isActive = s.name === activeStage;
            const isPast = cropInfo.stages.findIndex(st => st.name === activeStage) > i;
            return (
              <View key={s.name} style={styles.timelineItem}>
                <View style={[
                  styles.timelineDot,
                  {
                    backgroundColor: isActive ? s.color : isPast ? s.color : "#E0E0E0",
                    borderWidth: isActive ? 3 : 0,
                    borderColor: isActive ? "#fff" : "transparent",
                    transform: [{ scale: isActive ? 1.2 : 1 }]
                  }
                ]}>
                  <Text style={{ fontSize: isActive ? 16 : 12 }}>{s.icon}</Text>
                </View>
                {i < cropInfo.stages.length - 1 && (
                  <View style={[
                    styles.timelineConnector,
                    { backgroundColor: isPast ? s.color : "#E0E0E0" }
                  ]} />
                )}
                <Text style={[
                  styles.timelineName,
                  isActive && { color: "#333", fontWeight: "700" }
                ]} numberOfLines={2}>
                  {s.name}
                </Text>
                <Text style={styles.timelineDays}>
                  Day {s.dayRange[0]}-{s.dayRange[1]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Growth Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Growth Prediction</Text>
        <Text style={styles.cardSubtitle}>{crop} - {cropInfo.totalDays} day cycle</Text>

        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: curveRaw }]
          }}
          width={screenWidth}
          height={200}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity) => `rgba(124,179,66,${opacity})`,
            labelColor: () => "#999",
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#7CB342" }
          }}
          bezier
          style={{ borderRadius: 12 }}
          getDotColor={(dataPoint, index) =>
            index === currentDayIndex ? "#FF5722" : "#7CB342"
          }
          getDotProps={(dataPoint, index) =>
            index === currentDayIndex
              ? { r: "8", strokeWidth: "3", stroke: "#fff" }
              : { r: "4", strokeWidth: "2", stroke: "#7CB342" }
          }
          renderDotContent={({ x, y, index }) => {
            if (index !== currentDayIndex) return null;
            return (
              <Circle
                key="current-marker"
                cx={x}
                cy={y}
                r="14"
                fill="#FF5722"
                fillOpacity={0.2}
              />
            );
          }}
        />

        {/* Current position marker legend */}
        <View style={styles.chartMarker}>
          <View style={[styles.markerDot, { backgroundColor: "#FF5722" }]} />
          <Text style={styles.markerText}>You are here — {Math.max(0, cropInfo.totalDays - effectiveDays)} days left</Text>
        </View>
      </View>

      {/* Stage-Specific Tips */}
      <View style={styles.card}>
        <View style={styles.tipHeader}>
          <Text style={styles.cardTitle}>Tips for {activeStage}</Text>
          <View style={[styles.tipBadge, { backgroundColor: cropInfo.stages.find(s => s.name === activeStage)?.color || "#7CB342" }]}>
            <Text style={styles.tipBadgeText}>{crop}</Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={[styles.tipIcon, { backgroundColor: "#E8F5E9" }]}>
            <Text style={{ fontSize: 18 }}>{String.fromCodePoint(0x1F9EA)}</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Fertilizer</Text>
            <Text style={styles.tipText}>{activeTips.fertilizer || "Follow standard NPK schedule"}</Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={[styles.tipIcon, { backgroundColor: "#E3F2FD" }]}>
            <Text style={{ fontSize: 18 }}>{String.fromCodePoint(0x1F4A7)}</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Irrigation</Text>
            <Text style={styles.tipText}>{activeTips.water || "Water as needed based on soil moisture"}</Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={[styles.tipIcon, { backgroundColor: "#FFF3E0" }]}>
            <Text style={{ fontSize: 18 }}>{String.fromCodePoint(0x1F41B)}</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Pest & Disease</Text>
            <Text style={styles.tipText}>{activeTips.pest || "Regular scouting recommended"}</Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={[styles.tipIcon, { backgroundColor: "#F3E5F5" }]}>
            <Text style={{ fontSize: 18 }}>{String.fromCodePoint(0x2705)}</Text>
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Action Required</Text>
            <Text style={styles.tipText}>{activeTips.action || "Monitor crop progress"}</Text>
          </View>
        </View>
      </View>

      {/* Report Stage Mismatch */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Correct Growth Stage</Text>
        <Text style={styles.cardSubtitle}>
          If the auto-detected stage doesn't match your crop, select the actual stage below.
          This will update tips and progress preview - sowing date stays the same.
        </Text>

        <View style={styles.stageGrid}>
          {cropInfo.stages.map(s => (
            <TouchableOpacity
              key={s.name}
              style={[
                styles.stageBtn,
                activeStage === s.name && { backgroundColor: s.color, borderColor: s.color }
              ]}
              onPress={() => handleStageCorrection(s.name)}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</Text>
              <Text style={[
                styles.stageBtnText,
                activeStage === s.name && { color: "#fff" }
              ]} numberOfLines={1}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {overriddenStage && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => setOverriddenStage(null)}
          >
            <Ionicons name="refresh" size={14} color="#7CB342" />
            <Text style={styles.resetText}>Reset to auto-detected ({currentStage})</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16
  },

  progressCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8
  },

  percent: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333"
  },

  percentLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: -2
  },

  cropName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#333",
    marginTop: 14
  },

  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },

  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },

  infoText: {
    fontSize: 12,
    color: "#666"
  },

  stageBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 12
  },

  stageBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff"
  },

  overrideNote: {
    fontSize: 11,
    color: "#FF8A65",
    marginTop: 6,
    fontStyle: "italic"
  },

  harvestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10
  },

  harvestText: {
    fontSize: 13,
    color: "#7CB342",
    fontWeight: "600"
  },

  // Card
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4
  },

  cardSubtitle: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
    lineHeight: 16
  },

  // Timeline
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
    paddingHorizontal: 4
  },

  timelineItem: {
    alignItems: "center",
    flex: 1
  },

  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },

  timelineConnector: {
    position: "absolute",
    top: 17,
    left: "60%",
    right: "-40%",
    height: 3,
    borderRadius: 2
  },

  timelineName: {
    fontSize: 9,
    color: "#999",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500"
  },

  timelineDays: {
    fontSize: 8,
    color: "#ccc",
    marginTop: 2,
    textAlign: "center"
  },

  // Chart
  chartMarker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8
  },

  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7CB342"
  },

  markerText: {
    fontSize: 12,
    color: "#7CB342",
    fontWeight: "600"
  },

  // Tips
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },

  tipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },

  tipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff"
  },

  tipItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14
  },

  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },

  tipContent: {
    flex: 1
  },

  tipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 2
  },

  tipText: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18
  },

  // Stage correction
  stageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },

  stageBtn: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    minWidth: "30%",
    flex: 1
  },

  stageBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666"
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8
  },

  resetText: {
    fontSize: 12,
    color: "#7CB342",
    fontWeight: "600"
  }
});


