import mongoose from "mongoose";
const schema=mongoose.Schema;

const UserOTPVerificationSchema=new schema({
    uid:String,
    otp:String,
    createdAt:Date,
    expiresAt:Date
})

const UserOTPVerification=mongoose.model("UserOTPVerification",UserOTPVerificationSchema);

export default UserOTPVerification;

