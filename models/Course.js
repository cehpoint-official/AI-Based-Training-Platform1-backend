const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  user: String,
  content: { type: String, required: true },
  type: String,
  mainTopic: String,
  photo: String,
  date: { type: Date, default: Date.now },
  end: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }, // Add this line
});

module.exports = mongoose.model("Course", courseSchema);
