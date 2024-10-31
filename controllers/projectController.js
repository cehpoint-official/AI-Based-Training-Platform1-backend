const Project = require("../models/Project"); // Assuming you have a Project model
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.getProjectForAdmin = async (req, res) => {
  try {
    const projects = await Project.find(); 
    if (!projects) {
        return res.status(404).json({ success: false, message: "No projects found" });
    }
    res.json({ success: true, data: projects, message: "Projects fetched successfully" });
} catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
}
};

exports.saveProject = async (req, res) => {
  const { projectTitle, description, difficulty, time, userId, email, completed = false, github_url, firebaseUId, video_url } = req.body;

  try {
      const newProject = new Project({
          title: projectTitle,
          description, // Add description
          difficulty, // Add difficulty
          time, // Add time
          userId,
          email,
          completed,
          github_url,
          video_url,
          firebaseUId
      });

      await newProject.save();

      res.status(201).json({ success: true, message: "Project saved successfully!" });
  } catch (error) {
      console.error("Error saving project:", error);
      res.status(500).json({ success: false, message: "Error saving project" });
  }
};

exports.getUserProjects = async (req, res) => {
  const { firebaseUId } = req.query;

  try {
    const projects = await Project.find({ firebaseUId });

    if (!projects.length) {
      return res.status(404).json({ success: false, message: "No projects found" });
    }

    res.json({
      success: true,
      data: projects,
      message: "Projects fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    if (!projects) {
      return res
        .status(404)
        .json({ success: false, message: "No projects found" });
    }
    res.json({
      success: true,
      data: projects,
      message: "Projects fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateUserProject = async (req, res) => {
  try {
      const { projectId, completed, github_url, video_url, approve, description, difficulty, time } = req.body;

      if (!projectId) {
          return res.status(400).json({ success: false, message: "Project ID is required" });
      }

      const project = await Project.findById(projectId);

      if (!project) {
          return res.status(404).json({ success: false, message: "Project not found" });
      }

      if (typeof completed !== 'undefined') project.completed = completed;
      if (github_url) project.github_url = github_url;
      if (video_url) project.video_url = video_url;
      if (typeof approve !== 'undefined') project.approve = approve;
      if (description) project.description = description; // Update description
      if (difficulty) project.difficulty = difficulty; // Update difficulty
      if (time) project.time = time; // Update time

      await project.save();

      res.json({ success: true, message: "Project updated successfully", data: project });
  } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Approve a project
exports.approveProject = async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return res
      .status(400)
      .json({ success: false, message: "Project ID is required" });
  }

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    project.approve = 'accepted'; // Set approve to 'accepted' for approval
    await project.save();

    res.json({
      success: true,
      message: "Project approved successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error approving project:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Reject a project
exports.rejectProject = async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return res
      .status(400)
      .json({ success: false, message: "Project ID is required" });
  }

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    project.approve = 'rejected'; // Set approve to 'rejected' for rejection
    await project.save();

    res.json({
      success: true,
      message: "Project rejected successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error rejecting project:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

