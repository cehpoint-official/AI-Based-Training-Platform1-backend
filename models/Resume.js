const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  uid: { type: String, required: true, unique: true },
  resumeData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resume", resumeSchema);
