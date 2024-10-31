const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  password: String,
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
