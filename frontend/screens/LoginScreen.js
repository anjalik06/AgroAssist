import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import LottieView from "lottie-react-native";
import * as Animatable from "react-native-animatable";
import { API_BASE_URL } from "@env";

export default function LoginScreen({ navigation }) {

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {

    if(phone.length !== 10){
      Alert.alert("Invalid number","Please enter a valid 10 digit mobile number");
      return;
    }

    try{

      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          phone:phone
        })
      });

      const data = await response.json();

      if(data.success){
        Alert.alert("OTP Sent","Check your mobile for the OTP");
        navigation.navigate("OTP",{ phone });
      }else{
        Alert.alert("Error",data.message || "Failed to send OTP");
      }

    }catch(error){
      console.log(error);
      Alert.alert("Server Error","Unable to connect to server");
    }

    setLoading(false);
  };

  return (

    <View style={styles.container}>

      <Animatable.View
        animation="fadeInDown"
        duration={1200}
        style={styles.animationContainer}
      >
        <LottieView
          source={require("../assets/animations/farmer.json")}
          autoPlay
          loop
          resizeMode="contain"
          style={styles.animation}
        />
      </Animatable.View>

      <Animatable.Text animation="fadeIn" delay={300} style={styles.logo}>
        🌾 AgroAssist
      </Animatable.Text>

      <Animatable.View animation="fadeInUp" delay={400} style={styles.card}>

        <Text style={styles.subtitle}>Login with Mobile</Text>

        <TextInput
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={sendOtp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

      </Animatable.View>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#eaf4d3",
    justifyContent:"center",
    alignItems:"center",
    padding:20
  },

  animationContainer:{
    width:300,
    height:300,
    alignItems:"center",
    justifyContent:"center",
    marginBottom:10
  },

  animation:{
    width:"100%",
    height:"100%"
  },

  logo:{
    fontSize:30,
    fontWeight:"bold",
    color:"#2e7d32",
    marginBottom:20
  },

  card:{
    width:"100%",
    padding:25,
    borderRadius:20,
    backgroundColor:"rgba(255,255,255,0.35)",
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.5)",
    shadowColor:"#000",
    shadowOpacity:0.1,
    shadowRadius:10,
    elevation:5
  },

  subtitle:{
    textAlign:"center",
    fontSize:18,
    marginBottom:15,
    color:"#689f38"
  },

  input:{
    borderWidth:1,
    borderColor:"#cddc39",
    padding:12,
    borderRadius:12,
    marginBottom:20,
    backgroundColor:"rgba(255,255,255,0.6)"
  },

  button:{
    backgroundColor:"#8bc34a",
    padding:15,
    borderRadius:12
  },

  buttonText:{
    color:"#fff",
    textAlign:"center",
    fontWeight:"bold"
  }

});