import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";

export default function ProfileScreen() {

  const [phone,setPhone] = useState("");
  const [firstName,setFirstName] = useState("");
  const [lastName,setLastName] = useState("");
  const [age,setAge] = useState("");

  useEffect(()=>{

    fetchProfile();

  },[]);

  const fetchProfile = async () => {

    const token = await getToken();

    const response = await fetch(`${API_BASE_URL}/api/user/me`,{
      headers:{
        Authorization:`Bearer ${token}`
      }
    });

    const data = await response.json();

    setPhone(data.user.phone);
    setFirstName(data.user.firstName);
    setLastName(data.user.lastName);
    setAge(data.user.age?.toString() || "");

  };

  const updateProfile = async () => {

    const token = await getToken();

    await fetch(`${API_BASE_URL}/api/user/update-profile`,{

      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },

      body:JSON.stringify({
        firstName,
        lastName,
        age
      })

    });

    alert("Profile Updated");

  };

  return(

    <View style={styles.container}>

      {/* Avatar */}

      <Image
        source={{uri:"https://cdn-icons-png.flaticon.com/512/149/149071.png"}}
        style={styles.avatar}
      />

      <Text style={styles.phone}>{phone}</Text>

      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />

      <TextInput
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={updateProfile}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>

    </View>

  );

}

const styles = StyleSheet.create({

  container:{
    flex:1,
    padding:20,
    alignItems:"center",
    backgroundColor:"#eaf4d3"
  },

  avatar:{
    width:120,
    height:120,
    borderRadius:60,
    marginBottom:15
  },

  phone:{
    fontSize:18,
    marginBottom:20,
    fontWeight:"bold"
  },

  input:{
    width:"100%",
    backgroundColor:"#fff",
    padding:12,
    borderRadius:10,
    marginBottom:10
  },

  button:{
    backgroundColor:"#8bc34a",
    padding:15,
    borderRadius:10,
    width:"100%",
    marginTop:10
  },

  buttonText:{
    textAlign:"center",
    color:"#fff",
    fontWeight:"bold"
  }

});