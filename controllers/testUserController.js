import TestUser from "../models/TestUser.js";

export const createTestUser = async (req, res) => {
  const {
    fileName,
    fileUrl,
    userId,
    userEmail,
    userName,
    skills = [],
    experience = [],
    education = [],
    projects = [],
    certifications = [],
    extractedText = "",
  } = req.body;

  try {
    const newTestUser = new TestUser({
      fileName,
      fileUrl,
      userId,
      userEmail,
      userName,
      skills,
      experience,
      education,
      projects,
      certifications,
      extractedText,
      status: "processed", // Indicates that parsing is complete
    });

    await newTestUser.save();

    res.status(201).json({
      success: true,
      message: "Test user added successfully",
      data: newTestUser,
    });
  } catch (error) {
    console.error("Error adding test user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllTestUsers = async (req, res) => {
  try {
    // Fetch all test users from the database
    const testUsers = await TestUser.find(
      {},
      "userId fileName userEmail userName status recordings"
    );

    if (!testUsers || testUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No test users found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Test users retrieved successfully",
      data: testUsers,
    });
  } catch (error) {
    console.error("Error fetching test users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateRecordings = async (req, res) => {
  const { userId, screenUrl, faceUrl } = req.body;

  // Check only for userId, since screenUrl or faceUrl might be null
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  try {
    // Use conditional updating for recordings to handle possible null values
    const updateData = {};
    if (screenUrl) updateData["recordings.screen"] = screenUrl;
    if (faceUrl) updateData["recordings.face"] = faceUrl;

    const updatedUser = await TestUser.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recordings updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating recordings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const checkTestUserExists = async (req, res) => {
  const { userId } = req.params; // Extract userId from request parameters

  try {
    // Check if a user with the given userId exists
    const existingUser = await TestUser.findOne({ userId });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User  already exists",
        data: existingUser,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User  not found",
      });
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
