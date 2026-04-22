import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import ConsumerMarketplaceScreen from "../screens/ConsumerMarketplaceScreen";
import CartScreen from "../screens/CartScreen";
import ConsumerOrdersScreen from "../screens/ConsumerOrdersScreen";
import ConsumerProfileScreen from "../screens/ConsumerProfileScreen";

const Tab = createBottomTabNavigator();

export default function ConsumerTabNavigator({ setIsLogged, setUserRole }) {

return (

<Tab.Navigator
screenOptions={({ route }) => ({

headerShown:false,
tabBarShowLabel:true,

tabBarActiveTintColor:"#2e7d32",
tabBarInactiveTintColor:"#999",

tabBarStyle:{
height:65,
backgroundColor:"#ffffff",
borderTopWidth:0,
elevation:10,
paddingBottom:8,
paddingTop:5
},

tabBarItemStyle:{
flex:1,
alignItems:"center",
justifyContent:"center"
},

tabBarLabelStyle:{
fontSize:11,
fontWeight:"600"
},

tabBarIcon:({ focused, color }) => {

let iconName;

if(route.name==="Shop") iconName = focused ? "storefront" : "storefront-outline";
else if(route.name==="Cart") iconName = focused ? "cart" : "cart-outline";
else if(route.name==="Orders") iconName = focused ? "receipt" : "receipt-outline";
else if(route.name==="Profile") iconName = focused ? "person" : "person-outline";

return(
<Ionicons
name={iconName}
size={focused ? 26 : 22}
color={color}
/>
);

}

})}
>

<Tab.Screen name="Shop" component={ConsumerMarketplaceScreen} />
<Tab.Screen name="Cart" component={CartScreen} />
<Tab.Screen name="Orders" component={ConsumerOrdersScreen} />
<Tab.Screen name="Profile">
{(props) => (
<ConsumerProfileScreen {...props} setIsLogged={setIsLogged} setUserRole={setUserRole} />
)}
</Tab.Screen>

</Tab.Navigator>

);

}
