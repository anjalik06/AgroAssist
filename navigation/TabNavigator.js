import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/DashboardScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import CartScreen from "../screens/CartScreen";
import FarmProfileScreen from "../screens/FarmProfileScreen";

const Tab = createBottomTabNavigator();

export default function FarmerTabNavigator({ setIsLogged, setUserRole }) {

return (

<Tab.Navigator
screenOptions={({ route }) => ({

headerShown:false,
tabBarShowLabel:false,

tabBarActiveTintColor:"#2e7d32",
tabBarInactiveTintColor:"#777",

/* Footer bar */

tabBarStyle:{
height:65,
backgroundColor:"#ffffff",
borderTopWidth:0,
elevation:10
},

/* Fix alignment */

tabBarItemStyle:{
flex:1,
alignItems:"center",
justifyContent:"center",
marginTop:10
},

tabBarIcon:({ focused, color }) => {

let iconName;

if(route.name==="Home") iconName="home";
else if(route.name==="Market") iconName="storefront";
else if(route.name==="FarmProfile") iconName="person-circle";
else if(route.name==="Cart") iconName="cart";

return(
<Ionicons
name={iconName}
size={focused ? 28 : 24}
color={color}
/>
);

}

})}
>

<Tab.Screen name="Home">
  {(props) => <DashboardScreen {...props} setIsLogged={setIsLogged} setUserRole={setUserRole} />}
</Tab.Screen>
<Tab.Screen name="Market" component={MarketplaceScreen} />
<Tab.Screen name="FarmProfile">
  {() => <FarmProfileScreen setIsLogged={setIsLogged} setUserRole={setUserRole} />}
</Tab.Screen>
<Tab.Screen name="Cart" component={CartScreen} />

</Tab.Navigator>

);

}
