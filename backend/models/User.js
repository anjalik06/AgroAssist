const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  phone: {
    type: String,
    required: true,
    unique: true
  },

  firstName: {
    type: String,
    default: ""
  },

  lastName: {
    type: String,
    default: ""
  },

  age: {
    type: Number
  },

  farmName: {
    type: String,
    default: ""
  },

  role: {
    type: String,
    enum: ["farmer", "consumer", "user", null],
    default: null
  },

  address: {
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" }
  },

  profileCompleted: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("User", userSchema);