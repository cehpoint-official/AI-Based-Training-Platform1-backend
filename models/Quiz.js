import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    courseId: { type: String, required: true }, 
    score: { type: Number, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Quiz", quizSchema);