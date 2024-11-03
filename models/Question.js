import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "mcq"],
    default: "text",
  },
  skills: [
    {
      type: String,
      required: true,
    },
  ],
  choices: [
    {
      type: String,
    },
  ],
  correctAnswer: String,
});

export default mongoose.model("Question", questionSchema);
