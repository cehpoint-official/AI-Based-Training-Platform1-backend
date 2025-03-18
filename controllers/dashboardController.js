import User from '../models/User.js';
import Course from '../models/Course.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const getDashboardData = async (req, res) => {
  try {
    // Get total number of users
    const userCount = await User.countDocuments();

    // Get number of admin users
    const admins = await User.find({ role: "admin" }, "email");

    // Get number of free and paid users
    const freeCount = await User.countDocuments({ type: "free" });
    const paidCount = await User.countDocuments({ type: "paid" });

    // Get total number of courses
    const courseCount = await Course.countDocuments();

    // Get number of video & text courses
    const videoAndTextCourseCount = await Course.countDocuments({ type: "video & text course" });

    // Get number of text & image courses
    const textAndImageCourseCount = await Course.countDocuments({ type: "text & image course" });

    // Get number of completed courses
    const completedCourseCount = await Course.countDocuments({ completed: true });

    // Prepare the response object
    const dashboardData = {
      users: userCount,
      admins: admins,
      frees: freeCount,
      paids: paidCount,
      courses: courseCount,
      videoAndTextCourses: videoAndTextCourseCount,
      textAndImageCourses: textAndImageCourseCount,
      completedCourses: completedCourseCount
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const setapikey = async (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "API key is required" });
  }
  try {
    const result = await User.updateMany({}, { $set: { apiKey: key } });
    console.log(`API key updated for ${result.modifiedCount} users`);
    res.status(200).json({
      message: "API key changed successfully for all users",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    res.status(500).json({ error: "An error occurred while updating the API key" });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TERMS_FILE_PATH = path.join(__dirname, '../data/terms.json');
const PRIVACY_FILE_PATH = path.join(__dirname, '../data/privacy.json');

// Ensure the data directory exists
const ensureDataDirectory = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create terms.json if it doesn't exist
  if (!fs.existsSync(TERMS_FILE_PATH)) {
    fs.writeFileSync(TERMS_FILE_PATH, JSON.stringify({ content: "" }), 'utf8');
  }

  // Create privacy.json if it doesn't exist
  if (!fs.existsSync(PRIVACY_FILE_PATH)) {
    fs.writeFileSync(PRIVACY_FILE_PATH, JSON.stringify({ content: "" }), 'utf8');
  }
};

export const getTerms = async (req, res) => {
  try {
    ensureDataDirectory();

    if (fs.existsSync(TERMS_FILE_PATH)) {
      const termsData = JSON.parse(fs.readFileSync(TERMS_FILE_PATH, 'utf8'));
      return res.status(200).json(termsData);
    } else {
      return res.status(200).json({ content: "" });
    }
  } catch (error) {
    console.error('Error getting terms:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve terms' });
  }
};

export const saveTerms = async (req, res) => {
  try {
    ensureDataDirectory();

    const { content } = req.body;

    if (content === undefined) {
      return res.status(400).json({ success: false, message: 'No content provided' });
    }

    fs.writeFileSync(TERMS_FILE_PATH, JSON.stringify({ content }), 'utf8');

    return res.status(200).json({ success: true, message: 'Terms saved successfully' });
  } catch (error) {
    console.error('Error saving terms:', error);
    return res.status(500).json({ success: false, message: 'Failed to save terms' });
  }
};

export const getPrivacy = async (req, res) => {
  try {
    ensureDataDirectory();

    if (fs.existsSync(PRIVACY_FILE_PATH)) {
      const privacyData = JSON.parse(fs.readFileSync(PRIVACY_FILE_PATH, 'utf8'));
      return res.status(200).json(privacyData);
    } else {
      return res.status(200).json({ content: "" });
    }
  } catch (error) {
    console.error('Error getting privacy policy:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve privacy policy' });
  }
};

export const savePrivacy = async (req, res) => {
  try {
    ensureDataDirectory();

    const { content } = req.body;

    if (content === undefined) {
      return res.status(400).json({ success: false, message: 'No content provided' });
    }

    fs.writeFileSync(PRIVACY_FILE_PATH, JSON.stringify({ content }), 'utf8');

    return res.status(200).json({ success: true, message: 'Privacy policy saved successfully' });
  } catch (error) {
    console.error('Error saving privacy policy:', error);
    return res.status(500).json({ success: false, message: 'Failed to save privacy policy' });
  }
};