const client = require("../config/twilio");

exports.sendOtp = async (req,res)=>{

const { phone } = req.body;

try{

const response = await client.verify.v2
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

};

exports.verifyOtp = async (req,res)=>{

const { phone, otp } = req.body;

try{

const response = await client.verify.v2
.services(process.env.TWILIO_SERVICE_SID)
.verificationChecks.create({
to: `+91${phone}`,
code: otp
});

if(response.status === "approved"){
return res.json({
success:true,
message:"Login successful"
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

};