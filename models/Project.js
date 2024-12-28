import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true },
    time: { type: String, required: true },
    userId: { type: String, required: true },
    firebaseUId: { type: String, required: true },
    email: { type: String, required: true },
    completed: { type: Boolean, default: false, required: true },
    github_url: { type: String },
    video_url: { type: String },
    approve: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    dateCreated: { type: Date, default: Date.now },
  },
  { collection: "project-users" }
);

export default mongoose.model("Project", projectSchema);
