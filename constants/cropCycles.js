// Single source of truth for crop growth cycles.
// Used by MyPlantsScreen (list view) and GrowthTrackerScreen (detail view).

export const CROP_DATA = {

  Tomato: {
    totalDays: 90,
    icon: "\uD83C\uDF45",
    stages: [
      { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [26, 45], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [46, 65], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruiting", dayRange: [66, 80], icon: "\uD83C\uDF43", color: "#FF7043" },
      { name: "Harvest", dayRange: [81, 90], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 5, 12, 25, 40, 55, 70, 85, 95, 100]
  },

  Onion: {
    totalDays: 120,
    icon: "\uD83E\uDDC5",
    stages: [
      { name: "Germination", dayRange: [0, 12], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [13, 30], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [31, 60], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Bulb Formation", dayRange: [61, 90], icon: "\uD83E\uDDC5", color: "#FFB74D" },
      { name: "Maturation", dayRange: [91, 110], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [111, 120], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 3, 8, 15, 25, 40, 55, 70, 85, 100]
  },

  Potato: {
    totalDays: 100,
    icon: "\uD83E\uDD54",
    stages: [
      { name: "Sprouting", dayRange: [0, 15], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Vegetative", dayRange: [16, 35], icon: "\uD83E\uDEB4", color: "#81C784" },
      { name: "Tuber Initiation", dayRange: [36, 55], icon: "\uD83E\uDD54", color: "#FFB74D" },
      { name: "Tuber Bulking", dayRange: [56, 80], icon: "\uD83E\uDD54", color: "#FF8A65" },
      { name: "Maturation", dayRange: [81, 95], icon: "\uD83C\uDF3E", color: "#A1887F" },
      { name: "Harvest", dayRange: [96, 100], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 5, 10, 20, 35, 55, 75, 90, 97, 100]
  },

  Rice: {
    totalDays: 130,
    icon: "\uD83C\uDF3E",
    stages: [
      { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Tillering", dayRange: [26, 55], icon: "\uD83C\uDF3E", color: "#66BB6A" },
      { name: "Panicle Init.", dayRange: [56, 80], icon: "\uD83C\uDF3E", color: "#FFB74D" },
      { name: "Flowering", dayRange: [81, 100], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Harvest", dayRange: [101, 130], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 3, 8, 18, 30, 45, 60, 80, 92, 100]
  },

  Banana: {
    totalDays: 300,
    icon: "\uD83C\uDF4C",
    stages: [
      { name: "Establishment", dayRange: [0, 60], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Vegetative", dayRange: [61, 150], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [151, 210], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruiting", dayRange: [211, 270], icon: "\uD83C\uDF43", color: "#FFB74D" },
      { name: "Maturation", dayRange: [271, 290], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [291, 300], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 2, 5, 10, 20, 35, 50, 70, 90, 100]
  },

  Carrot: {
    totalDays: 80,
    icon: "\uD83E\uDD55",
    stages: [
      { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [11, 20], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [21, 45], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Root Swelling", dayRange: [46, 65], icon: "\uD83E\uDD55", color: "#FFB74D" },
      { name: "Maturation", dayRange: [66, 75], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [76, 80], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 5, 12, 25, 40, 60, 80, 92, 98, 100]
  },

  Cabbage: {
    totalDays: 90,
    icon: "\uD83E\uDD6C",
    stages: [
      { name: "Germination", dayRange: [0, 8], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [9, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [26, 50], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Head Formation", dayRange: [51, 75], icon: "\uD83E\uDD6C", color: "#FFB74D" },
      { name: "Maturation", dayRange: [76, 85], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [86, 90], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 4, 10, 22, 40, 60, 80, 92, 98, 100]
  },

  Spinach: {
    totalDays: 45,
    icon: "\uD83E\uDD6C",
    stages: [
      { name: "Germination", dayRange: [0, 7], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [8, 15], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [16, 30], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Maturation", dayRange: [31, 40], icon: "\uD83C\uDF3E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [41, 45], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 8, 20, 40, 60, 80, 92, 97, 99, 100]
  },

  Mango: {
    totalDays: 150,
    icon: "\uD83E\uDD6D",
    stages: [
      { name: "Bud Break", dayRange: [0, 15], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Flowering", dayRange: [16, 40], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruit Set", dayRange: [41, 70], icon: "\uD83C\uDF43", color: "#66BB6A" },
      { name: "Fruit Dev.", dayRange: [71, 120], icon: "\uD83E\uDD6D", color: "#FFB74D" },
      { name: "Ripening", dayRange: [121, 145], icon: "\uD83E\uDD6D", color: "#FF8A65" },
      { name: "Harvest", dayRange: [146, 150], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 4, 10, 22, 38, 55, 72, 88, 96, 100]
  },

  Apple: {
    totalDays: 180,
    icon: "\uD83C\uDF4E",
    stages: [
      { name: "Dormancy", dayRange: [0, 30], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Bud Break", dayRange: [31, 50], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Flowering", dayRange: [51, 70], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruit Set", dayRange: [71, 100], icon: "\uD83C\uDF43", color: "#66BB6A" },
      { name: "Fruit Dev.", dayRange: [101, 160], icon: "\uD83C\uDF4E", color: "#FF8A65" },
      { name: "Harvest", dayRange: [161, 180], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 3, 8, 18, 32, 50, 70, 88, 97, 100]
  },

  Peas: {
    totalDays: 70,
    icon: "\uD83E\uDED1",
    stages: [
      { name: "Germination", dayRange: [0, 8], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [9, 20], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [21, 35], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [36, 50], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Pod Fill", dayRange: [51, 65], icon: "\uD83E\uDED1", color: "#FF8A65" },
      { name: "Harvest", dayRange: [66, 70], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 6, 14, 28, 45, 65, 82, 93, 98, 100]
  },

  Brinjal: {
    totalDays: 85,
    icon: "\uD83C\uDF46",
    stages: [
      { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [26, 45], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [46, 60], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruiting", dayRange: [61, 80], icon: "\uD83C\uDF46", color: "#FF7043" },
      { name: "Harvest", dayRange: [81, 85], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 5, 13, 26, 42, 58, 74, 88, 96, 100]
  },

  Okra: {
    totalDays: 60,
    icon: "\uD83E\uDED1",
    stages: [
      { name: "Germination", dayRange: [0, 7], icon: "\uD83C\uDF31", color: "#AED581" },
      { name: "Seedling", dayRange: [8, 18], icon: "\uD83C\uDF3F", color: "#81C784" },
      { name: "Vegetative", dayRange: [19, 35], icon: "\uD83E\uDEB4", color: "#66BB6A" },
      { name: "Flowering", dayRange: [36, 45], icon: "\uD83C\uDF3C", color: "#FDD835" },
      { name: "Fruiting", dayRange: [46, 55], icon: "\uD83E\uDED1", color: "#FF7043" },
      { name: "Harvest", dayRange: [56, 60], icon: "\uD83E\uDDFA", color: "#8D6E63" }
    ],
    growthCurve: [0, 6, 16, 32, 50, 68, 82, 92, 98, 100]
  }

};

export const DEFAULT_CROP = {
  totalDays: 90,
  icon: "\uD83C\uDF31",
  stages: [
    { name: "Germination", dayRange: [0, 10], icon: "\uD83C\uDF31", color: "#AED581" },
    { name: "Seedling", dayRange: [11, 25], icon: "\uD83C\uDF3F", color: "#81C784" },
    { name: "Vegetative", dayRange: [26, 50], icon: "\uD83E\uDEB4", color: "#66BB6A" },
    { name: "Flowering", dayRange: [51, 70], icon: "\uD83C\uDF3C", color: "#FDD835" },
    { name: "Fruiting", dayRange: [71, 85], icon: "\uD83C\uDF43", color: "#FF7043" },
    { name: "Harvest", dayRange: [86, 90], icon: "\uD83E\uDDFA", color: "#8D6E63" }
  ],
  growthCurve: [0, 5, 15, 30, 50, 65, 80, 90, 97, 100]
};

export function getCropInfo(name) {
  return CROP_DATA[name] || DEFAULT_CROP;
}

export function getStageForDay(day, stages) {
  for (const s of stages) {
    if (day >= s.dayRange[0] && day <= s.dayRange[1]) return s.name;
  }
  if (day > stages[stages.length - 1].dayRange[1]) return stages[stages.length - 1].name;
  return stages[0].name;
}

export function computeProgress(name, sowingDate) {
  const info = getCropInfo(name);
  const days = Math.max(0, Math.floor((new Date() - new Date(sowingDate)) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, Math.max(0, Math.round((days / info.totalDays) * 100)));
  const stageName = getStageForDay(days, info.stages);
  const stageIndex = info.stages.findIndex(s => s.name === stageName);
  const daysLeft = Math.max(0, info.totalDays - days);
  return {
    days,
    progress,
    stageName,
    stageIndex,
    totalStages: info.stages.length,
    daysLeft,
    totalDays: info.totalDays,
    icon: info.icon
  };
}
