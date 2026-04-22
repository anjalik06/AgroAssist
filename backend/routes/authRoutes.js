const express = require("express");
const router = express.Router();
const client = require("../config/twilio");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


router.post("/send-otp", async (req, res) => {

const { phone } = req.body;

try{

await client.verify.v2
.services(process.env.TWILIO_SERVICE_SID)
.verifications.create({
to: `+91${phone}`,
channel: "sms"
});

res.json({
success:true,
message:"OTP sent"
});

}catch(err){

console.log(err);

res.status(500).json({
message:"Failed to send OTP"
});

}

});

router.post("/verify-otp", async (req,res)=>{

const { phone, otp } = req.body;

try{

const response = await client.verify.v2
.services(process.env.TWILIO_SERVICE_SID)
.verificationChecks.create({
to:`+91${phone}`,
code:otp
});

if(response.status === "approved"){

// check user
let user = await User.findOne({ phone });
let isNewUser = false;

if(!user){

// create user automatically
user = await User.create({
phone
});
isNewUser = true;

}

const token = jwt.sign(
{ id: user._id, phone: user.phone, role: user.role },
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);

return res.json({
success:true,
message:"Login successful",
token,
user,
isNewUser
});

}

res.status(400).json({
message:"Invalid OTP"
});

}catch(err){

console.log(err);

res.status(500).json({
message:"Verification failed"
});

}

});

module.exports = router;