import React from "react";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

export default function SplashScreen() {

  return (
    <View style={styles.container}>

      <LottieView
        source={require("../assets/animations/farmer.json")}
        autoPlay
        loop
        style={{ width:200, height:200 }}
      />

      <Text style={styles.title}>AgroAssist</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#eaf4d3"
  },
  title:{
    fontSize:28,
    fontWeight:"bold",
    color:"#2e7d32",
    marginTop:10,
    marginBottom:40
  }
});