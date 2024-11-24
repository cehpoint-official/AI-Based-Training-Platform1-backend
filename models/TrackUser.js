import mongoose from 'mongoose';

// Schema for daily performance records
const dailyPerformanceSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true }, // Ensure each date is unique
  totalScore: { type: Number, default: 0 } // Store only the total score for that day
});

// Schema for performance scores
const performanceScoreSchema = new mongoose.Schema({
  projectCount: { type: Number, default: 0 },
  courseCount: { type: Number, default: 0 },
  quizScoreAvg: { type: Number, default: 0 },
  averageProgress: { type: Number, default: 0 },
});

// Main schema for tracking users
const trackUserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: { type: String },
  type: { type: String },
  uid: { type: String, required: true, unique: true },
  strick: { type: Number },
  dailyPerformance: [dailyPerformanceSchema], // Array of daily performance records
  performanceScore: { type: performanceScoreSchema, default: {} } // Store overall performance metrics
});

// Export the model
export default mongoose.model("TrackUser", trackUserSchema);