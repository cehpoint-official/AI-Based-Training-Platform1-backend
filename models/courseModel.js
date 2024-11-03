import mongoose from "mongoose"

const courseSchema = new mongoose.Schema({
    user: String,
    content: { type: String, required: true },
    type: String,
    mainTopic: String,
    photo: String,
    date: { type: Date, default: Date.now },
    end: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
  });
  
  //MODEL
  const Course = mongoose.model("Course", courseSchema);

  export default Course