import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  user: String,
  content: { type: String, required: true },
  type: String,
  mainTopic: String,
  subTopic: String,
  photo: String,
  date: { type: Date, default: Date.now },
  end: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
});

// Try-catch approach to handle model compilation
let Course;
try {
  // Try to retrieve existing model
  Course = mongoose.model("Course");
} catch (error) {
  // Model doesn't exist yet, so create it
  Course = mongoose.model("Course", courseSchema);
}

export default Course;
