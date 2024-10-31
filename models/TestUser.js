const mongoose = require("mongoose");

const testUserSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    fileUrl: { type: String, required: true },
    status: { type: String, default: "uploaded" },
    userId: { type: String, required: true },
    userEmail: { type: String, default: "Unknown" },
    userName: { type: String, default: "Unknown" },
    // New fields for parsed resume data
    skills: [{ type: String }],
    experience: [{ type: String }],
    education: [{ type: String }],
    projects: [{ type: String }],
    certifications: [{ type: String }],
    // Optional: You might want to store the full extracted text as well
    extractedText: { type: String },
  },
  { collection: "testUsers" }
);

module.exports = mongoose.model("TestUser", testUserSchema);
