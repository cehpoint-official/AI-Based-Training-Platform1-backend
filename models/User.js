const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  password: String,
  profile: {
    type: String,
    default: "https://firebasestorage.googleapis.com/v0/b/ai-based-training-platfo-ca895.appspot.com/o/user.png?alt=media&token=cdde4ad1-26e7-4edb-9f7b-a3172fbada8d"
  },
  role: {
    type: String,
    default: "user",
  },
  type: String,
  uid: { type: String, required: true, unique: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  apiKey: { type: String, default: null },
});

module.exports = mongoose.model("User", userSchema);
