const mongoose = require("mongoose");

const PlantSchema = new mongoose.Schema({
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},
name:{
type:String,
required:true
},
sowingDate:{
type:String,
required:true
},
overriddenStage:{
type:String,
default:null
},
createdAt:{
type:Date,
default:Date.now
}
});

module.exports = mongoose.model("Plant",PlantSchema);