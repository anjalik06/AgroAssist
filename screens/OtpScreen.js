import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert
} from "react-native";

import * as Animatable from "react-native-animatable";
import { saveToken, saveRole } from "../services/authStorage";
import { API_BASE_URL } from "@env";

export default function OtpScreen({ navigation, route, setIsLogged, setUserRole }) {

  const { phone } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  const handleChange = (text, index) => {

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }

  };

  const handleBackspace = (key, index) => {

    if (key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }

  };

  const verifyOtp = async () => {

    const code = otp.join("");

    if (code.length !== 6) {
      Alert.alert("Invalid OTP", "Enter 6 digit OTP");
      return;
    }

    try {

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          otp: code
        })
      });

      const data = await response.json();

      if (data.success) {

        // save token
        await saveToken(data.token);

        // save role if returning user has one (treat "user" as no role)
        if (data.user && data.user.role && data.user.role !== "user") {
          await saveRole(data.user.role);
          setUserRole(data.user.role);
        } else {
          setUserRole(null);
        }

        // update login state
        setIsLogged(true);

      } else {

        Alert.alert("Error", data.message || "Invalid OTP");

      }

    } catch (error) {

      console.log(error);
      Alert.alert("Server Error", "Verification failed");

    }

  };

  return (

    <View style={styles.container}>

      <Animatable.Text animation="fadeInDown" style={styles.title}>
        Verify OTP
      </Animatable.Text>

      <Text style={styles.subtitle}>
        Enter the 6 digit OTP sent to your mobile
      </Text>

      <Animatable.View animation="zoomIn" style={styles.otpContainer}>

        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) =>
              handleBackspace(nativeEvent.key, index)
            }
          />
        ))}

      </Animatable.View>

      <TouchableOpacity
        style={styles.button}
        onPress={verifyOtp}
      >
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>

    </View>

  );

}

const styles = StyleSheet.create({

  container:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#f4ffe8",
    padding:20
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    color:"#2e7d32",
    marginBottom:10
  },

  subtitle:{
    color:"#666",
    marginBottom:30
  },

  otpContainer:{
    flexDirection:"row",
    justifyContent:"space-between",
    width:"90%",
    marginBottom:30
  },

  otpBox:{
    width:50,
    height:60,
    borderWidth:2,
    borderColor:"#8bc34a",
    borderRadius:12,
    textAlign:"center",
    fontSize:22,
    backgroundColor:"#fff"
  },

  button:{
    backgroundColor:"#8bc34a",
    padding:15,
    borderRadius:12,
    width:"80%"
  },

  buttonText:{
    textAlign:"center",
    color:"#fff",
    fontWeight:"bold",
    fontSize:16
  }

});