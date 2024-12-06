import User from '../models/User.js';
import Course from '../models/Course.js';


export const getDashboardData = async (req, res) => {
    try {
        // Get total number of users
        const userCount = await User.countDocuments();

        // Get number of admin users
        const adminCount = await User.countDocuments({ role: "admin" });

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
            admins: adminCount,
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
  // Update permission field
export const updatePermission = async (req, res) => {
  const { email } = req.body; // Extract user ID from request params
  const { permission } = req.body; // Extract permission from request body

  try {
    // Find the user by UID
    const user = await User.findOne({email});

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the permission field
    user.permission = permission;
    await user.save();

    res.status(200).json({ message: "Permission updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating permission", error: error.message });
  }
};