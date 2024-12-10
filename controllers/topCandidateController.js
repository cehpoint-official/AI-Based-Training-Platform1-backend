import mongoose from "mongoose";
import Course from "../models/Course.js";
import Project from "../models/Project.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import TrackUser from "../models/TrackUser.js";

export const getPerformanceByUID = async (req, res) => {
  try {
    const { uid } = req.params; // Extract UID from params
    
    // Find the performance data for the user
    const userTrack = await TrackUser.findOne({ uid });
    if (!userTrack) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({ success: true, data: userTrack });
  } catch (error) {
    console.error("Error fetching performance by UID:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getPerformanceOfAllUser = async (req, res) => {
  try {
    const usersWithDetails = await User.aggregate([
      {
        $lookup: {
          from: "project-users", // Adjust based on your actual collection name
          localField: "uid",
          foreignField: "firebaseUId",
          as: "projects",
        },
      },
      {
        $lookup: {
          from: "courses", // Ensure this matches your course collection name
          localField: "uid",
          foreignField: "user",
          as: "courses",
        },
      },
      {
        $lookup: {
          from: "quizzes", // Ensure this matches your quiz collection name
          localField: "uid",
          foreignField: "userId",
          as: "quizzes",
        },
      },
      {
        $addFields: {
          projectCount: { $size: "$projects" },
          courseCount: { $size: "$courses" },
          quizScoreAvg: {
            $cond: {
              if: { $gt: [{ $size: "$quizzes" }, 0] },
              then: { $avg: "$quizzes.score" },
              else: 0,
            },
          },
          averageProgress: {
            $cond: {
              if: { $gt: [{ $size: "$courses" }, 0] },
              then: { $avg: "$courses.progress" },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          email: 1,
          mName: 1,
          profile: 1,
          role: 1,
          type: 1,
          uid: 1,
          projectCount: 1,
          courseCount: 1,
          quizScoreAvg: 1,
          averageProgress: 1, // Include average progress
        },
      },
    ]);

    // Store or update performance in TrackUser  collection
    for (const user of usersWithDetails) {

      const totalScore = user.projectCount + user.courseCount + user.quizScoreAvg + user.averageProgress;

      // Get today's date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format date as string

      // Find the existing performance record for today
      const userTrack = await TrackUser .findOne({ uid: user.uid });

      if (userTrack) {
        // Check if today's date already exists in dailyPerformance
        const todayPerformance = userTrack.dailyPerformance.find(
          (entry) => entry.date.toISOString().split('T')[0] === todayString
        );

        if (todayPerformance) {
          // If today's performance exists, update the totalScore
          todayPerformance.totalScore = totalScore;

        } else {
          // If today's performance does not exist, add a new entry
          userTrack.dailyPerformance.push({
            date: today,
            totalScore: totalScore,
          });
        }


        // Update overall performance score
        userTrack.performanceScore = {
          projectCount: user.projectCount,
          courseCount: user.courseCount,
          quizScoreAvg: user.quizScoreAvg,
          averageProgress: user.averageProgress,
          totalScore: totalScore,
        };

        // Save the updated userTrack document
        await userTrack.save();
      } else {
        // If the user does not exist in TrackUser , create a new record
        const newTrackUser  = new TrackUser ({
          email: user.email,
          mName: user.mName,
          type: user.type,
          uid: user.uid,
          dailyPerformance: [{ date: today, totalScore: totalScore }],
          performanceScore: {
            projectCount: user.projectCount,
            courseCount: user.courseCount,
            quizScoreAvg: user.quizScoreAvg,
            averageProgress: user.averageProgress,
            totalScore: totalScore,
          },
          testScore: 0,
        });

        await newTrackUser .save();
      }

    }

    res.status(200).json({ success: true, data: usersWithDetails });
  } catch (error) {
    console.error(" Error fetching top candidates:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// export const updateCountsForAllUsers = async (req, res) => {
//   try {
//     // Fetch all TrackUser documents
//     const allUsers = await TrackUser.find();

//     for (const user of allUsers) {
//       let previousTotalScore = 0; // Initialize previous score for comparison

//       // Update dailyPerformance with calculated count
//       user.dailyPerformance = user.dailyPerformance.map((entry) => {
//         const currentTotalScore = entry.totalScore || 0;
//         const count = currentTotalScore - previousTotalScore > 0 ? 1 : 0;
//         previousTotalScore = currentTotalScore; // Update previous score for the next iteration

//         return {
//           ...entry._doc, // Retain existing fields
//           count, // Add or update the count field
//         };
//       });

//       // Save updated document to the database
//       await user.save();
//     }

//     res.status(200).json({ success: true, message: "Counts updated successfully for all users." });
//   } catch (error) {
//     console.error("Error updating counts:", error);
//     res.status(500).json({ success: false, error: "Failed to update counts." });
//   }
// };

export const updateCountsForAllUsers = async (req, res) => {
  try {
    // Fetch all TrackUser documents
    const allUsers = await TrackUser.find();

    for (const user of allUsers) {
      let previousTotalScore = 0; // Initialize previous score for comparison
      let currentStreak = 0; // Initialize current streak
      let maxStreak = user.max_strick || 0; // Use stored max streak or default to 0

      // Update dailyPerformance with calculated count
      user.dailyPerformance = user.dailyPerformance.map((entry) => {
        const currentTotalScore = entry.totalScore || 0;

        // Calculate count
        const count = currentTotalScore - previousTotalScore > 0 ? 1 : 0;
        previousTotalScore = currentTotalScore; // Update previous score for the next iteration

        // Update streaks
        if (count === 1) {
          currentStreak += 1; // Increment streak for consecutive positive days
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak; // Update max streak if current streak exceeds it
          }
        } else {
          currentStreak = 0; // Reset current streak on a zero count day
        }

        return {
          ...entry._doc, // Retain existing fields
          count, // Add or update the count field
        };
      });

      // Update the user's streak and max streak
      user.strick = currentStreak;
      user.max_strick = maxStreak;

      // Save updated document to the database
      await user.save();
    }

    res.status(200).json({ success: true, message: "Counts and streaks updated successfully for all users." });
  } catch (error) {
    // console.error("Error updating counts and streaks:", error);
    res.status(500).json({ success: false, error: "Failed to update counts and streaks." });
  }
};

export const updateTestScore = async (req, res) => {
  const { uid, testScore } = req.body;

  if (!uid || testScore === undefined) {
    return res.status(400).json({ message: 'UID and testScore are required' });
  }

  try {
    // Find the user by UID
    const user = await TrackUser.findOne({ uid });

    // If the user doesn't exist, return an error
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the user exists but does not have the testScore field, set it
    if (user.testScore === undefined) {
      user.testScore = testScore;
      // Save the document with the new testScore
      await user.save();
      return res.status(200).json({
        message: 'Test score added successfully',
        data: user,
      });
    } else {
      // If testScore exists, update it
      user.testScore = testScore;
      await user.save();
      return res.status(200).json({
        message: 'Test score updated successfully',
        data: user,
      });
    }
  } catch (error) {
    console.error('Error updating testScore:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};
