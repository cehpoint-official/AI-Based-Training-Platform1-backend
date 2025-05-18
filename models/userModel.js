import mongoose from "mongoose";

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
  unsplashApiKey: { type: String, default: null },
});

// Try-catch approach to handle model compilation
let User;
try {
  // Try to retrieve existing model
  User = mongoose.model("User");
} catch (error) {
  // Model doesn't exist yet, so create it
  User = mongoose.model("User", userSchema);
}

export default User;
