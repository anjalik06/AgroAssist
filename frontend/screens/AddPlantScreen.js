import React, { useState } from "react";
import {
View,
Text,
StyleSheet,
TouchableOpacity,
FlatList
} from "react-native";
import { API_BASE_URL } from "@env";
import { getToken } from "../services/authStorage";

export default function AddPlantScreen({ navigation }) {

const [category,setCategory] = useState("");
const [selectedPlant,setSelectedPlant] = useState("");

const vegetables = [
"Tomato","Potato","Onion","Carrot","Cabbage",
"Spinach","Brinjal","Okra","Pumpkin","Peas"
];

const fruits = [
"Mango","Banana","Apple","Papaya","Orange",
"Guava","Pineapple","Watermelon","Grapes","Pomegranate"
];

const data = category === "Vegetable" ? vegetables : fruits;

const handleSubmit = async () => {

if(!selectedPlant){
alert("Select plant");
return;
}

const plantData = {
name:selectedPlant,
sowingDate:new Date().toISOString().split("T")[0]
};

try{

const token = await getToken();

await fetch(`${API_BASE_URL}/api/plants/add`,{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization": `Bearer ${token}`
},
body:JSON.stringify(plantData)
});

navigation.goBack();

}catch(err){
console.log(err);
}

};

return(

<View style={styles.container}>

<Text style={styles.title}>🌱 Add Plant</Text>

<View style={styles.row}>

<TouchableOpacity
style={[styles.category,category==="Vegetable" && styles.active]}
onPress={()=>{
setCategory("Vegetable");
setSelectedPlant("");
}}
>
<Text>Vegetables</Text>
</TouchableOpacity>

<TouchableOpacity
style={[styles.category,category==="Fruit" && styles.active]}
onPress={()=>{
setCategory("Fruit");
setSelectedPlant("");
}}
>
<Text>Fruits</Text>
</TouchableOpacity>

</View>

{category!=="" && (

<FlatList
data={data}
keyExtractor={(item)=>item}
renderItem={({item})=>(

<TouchableOpacity
style={[
styles.plantCard,
selectedPlant===item && styles.selectedPlant
]}
onPress={()=>setSelectedPlant(item)}
>

<Text style={styles.plantText}>{item}</Text>

</TouchableOpacity>

)}
/>

)}

<TouchableOpacity
style={styles.submit}
onPress={handleSubmit}
>
<Text style={styles.submitText}>Save Plant</Text>
</TouchableOpacity>

</View>

);

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#eef6e7",
padding:20
},

title:{
fontSize:24,
fontWeight:"bold",
marginBottom:20,
color:"#2e7d32"
},

row:{
flexDirection:"row",
marginBottom:20
},

category:{
backgroundColor:"#fff",
padding:12,
borderRadius:12,
marginRight:10,
elevation:3
},

active:{
backgroundColor:"#c8e6c9"
},

plantCard:{
backgroundColor:"#fff",
padding:18,
borderRadius:15,
marginBottom:12,
elevation:4
},

selectedPlant:{
backgroundColor:"#8bc34a"
},

plantText:{
fontSize:16,
fontWeight:"500"
},

stageTitle:{
fontSize:16,
fontWeight:"700",
color:"#2e7d32",
marginTop:4,
marginBottom:10
},

stageRow:{
flexDirection:"row",
flexWrap:"wrap",
gap:8,
marginBottom:6
},

stageChip:{
backgroundColor:"#fff",
paddingVertical:8,
paddingHorizontal:12,
borderRadius:18,
borderWidth:1,
borderColor:"#cfd8dc"
},

stageChipActive:{
backgroundColor:"#7cb342",
borderColor:"#7cb342"
},

stageText:{
fontSize:12,
fontWeight:"600",
color:"#4f5b62"
},

stageTextActive:{
color:"#fff"
},

submit:{
backgroundColor:"#4caf50",
padding:15,
borderRadius:15,
alignItems:"center",
marginTop:15
},

submitText:{
color:"#fff",
fontSize:16,
fontWeight:"bold"
}

});
