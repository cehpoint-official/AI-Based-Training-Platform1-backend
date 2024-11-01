const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  password: String,
  profile: {
    type: String,
    default: "https://firebasestorage.googleapis.com/v0/b/ai-based-training-platfo-ca895.appspot.com/o/user.png?alt=media&token=9c07ad9f-2390-4717-b83e-8af33a5da8d2"
  },
  role: {
    type: String,
    default: "nonadmin",
  },
  type: String,
  uid: { type: String, required: true, unique: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  apiKey: { type: String, default: null },
});

module.exports = mongoose.model("User", userSchema);
