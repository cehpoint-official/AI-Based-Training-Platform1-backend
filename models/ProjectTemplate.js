import mongoose from 'mongoose';

const ProjectTemplateSchema = new mongoose.Schema(
  {
    category: { type: String, required: true }, // Category like 'web', 'android', 'ML', etc.
    title: { type: String, required: true }, // Title of the project
    description: { type: String, required: true }, // Description of the project
    difficulty: { type: String, required: true }, // e.g., 'Beginner', 'Intermediate', 'Advanced'
    time: { type: String, required: true }, // e.g., '1 week', '2 weeks'
    date: { type: Date, default: Date.now }, // Date when the project was added
    assignedTo: {
      type: [
        {
          userid: { type: String, required: true },
          title: { type: String, required: true },
        },
      ],
      default: [],
    },
    // Array to store user IDs who have saved the project
  },
  { collection: "main_projects" }
);

export default mongoose.model("ProjectTemplate", ProjectTemplateSchema);
