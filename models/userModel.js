import mongoose from "mongoose"


const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    mName: String,
    password: String,
    role: {
      type: String,
      default: "admin",
    },
    type: String,
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    apiKey: { type: String, default: null },
    unsplashApiKey:{type:String,default:null}
  });
  

const User = mongoose.model("User", userSchema);
export default User