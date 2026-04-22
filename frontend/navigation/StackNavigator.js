import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import FarmerTabNavigator from "./TabNavigator";
import ConsumerTabNavigator from "./ConsumerTabNavigator";
import OtpScreen from "../screens/OtpScreen";
import RoleSelectionScreen from "../screens/RoleSelectionScreen";
import DeliveryConfirmScreen from "../screens/DeliveryConfirmScreen";
import CropRecommendationScreen from "../screens/CropRecommendationScreen";
import MyPlantsScreen from "../screens/MyPlantsScreen";
import AddPlantScreen from "../screens/AddPlantScreen";
import GrowthTrackerScreen from "../screens/GrowthTrackerScreen";
import MarketPriceScreen from "../screens/MarketPriceScreen";
import ProfileScreen from "../screens/ProfileScreen";
import FarmDetailScreen from "../screens/FarmDetailScreen";
import CropInsightScreen from "../screens/CropInsightScreen";
import FarmerOrdersScreen from "../screens/FarmerOrdersScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator({ isLogged, setIsLogged, userRole, setUserRole }) {

return (

<Stack.Navigator screenOptions={{ headerShown: false }}>

{!isLogged ? (

<>

<Stack.Screen name="Login">
{(props) => (
<LoginScreen {...props} setIsLogged={setIsLogged} />
)}
</Stack.Screen>

<Stack.Screen name="OTP">
{(props) => (
<OtpScreen {...props} setIsLogged={setIsLogged} setUserRole={setUserRole} />
)}
</Stack.Screen>

</>

) : !userRole ? (

<>

<Stack.Screen name="RoleSelection">
{(props) => (
<RoleSelectionScreen {...props} setUserRole={setUserRole} />
)}
</Stack.Screen>

</>

) : userRole === "farmer" ? (

<>

<Stack.Screen name="Home">
{(props) => (
<FarmerTabNavigator {...props} setIsLogged={setIsLogged} setUserRole={setUserRole} />
)}
</Stack.Screen>

<Stack.Screen
name="DeliveryConfirm"
component={DeliveryConfirmScreen}
/>

<Stack.Screen
name="CropAdvice"
component={CropRecommendationScreen}
options={{ headerShown: true, title: "Crop Advisor" }}
/>

<Stack.Screen
name="CropInsight"
component={CropInsightScreen}
/>

<Stack.Screen
name="MyPlants"
component={MyPlantsScreen}
options={{ headerShown: true }}
/>

<Stack.Screen
name="AddPlant"
component={AddPlantScreen}
options={{ headerShown: true }}
/>

<Stack.Screen
name="Growth"
component={GrowthTrackerScreen}
options={{ headerShown: true, title: "Growth Tracker" }}
/>

<Stack.Screen
name="MarketPrice"
component={MarketPriceScreen}
options={{ headerShown: true, title: "Market Prices" }}
/>

<Stack.Screen
name="Profile"
component={ProfileScreen}
options={{ headerShown: true, title: "Profile" }}
/>

<Stack.Screen
name="FarmerOrders"
component={FarmerOrdersScreen}
options={{ headerShown: false }}
/>

</>

) : (

<>

<Stack.Screen name="Home">
{(props) => (
<ConsumerTabNavigator {...props} setIsLogged={setIsLogged} setUserRole={setUserRole} />
)}
</Stack.Screen>

<Stack.Screen
name="FarmDetail"
component={FarmDetailScreen}
/>

<Stack.Screen
name="DeliveryConfirm"
component={DeliveryConfirmScreen}
/>

</>

)}

</Stack.Navigator>

);

}
