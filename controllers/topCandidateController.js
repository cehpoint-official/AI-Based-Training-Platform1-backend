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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
      const totalScore =
        user.projectCount +
        user.courseCount +
        user.quizScoreAvg +
        user.averageProgress;

        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // Format today's date
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // Calculate yesterday's date
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        const userTrack = await TrackUser.findOne({ uid: user.uid });
        
        if (userTrack) {
          // Find today's and yesterday's performance
          const todayPerformance = userTrack.dailyPerformance.find(
            (entry) => entry.date.toISOString().split('T')[0] === todayString
          );
        
          const yesterdayPerformance = userTrack.dailyPerformance.find(
            (entry) => entry.date.toISOString().split('T')[0] === yesterdayString
          );
        
          const yesterdayScore = yesterdayPerformance ? yesterdayPerformance.totalScore : 0; // Default to 0 if no record
        
          const count = (totalScore - yesterdayScore > 0) ? 1 : 0; // Check if totalScore is greater than previous day score
        
          if (todayPerformance) {
            // Update today's performance
            todayPerformance.totalScore = totalScore;
            todayPerformance.count = count; // Update the count based on the condition
          } else {
            // Add today's performance, assume previous day's score was 0 if not found
            userTrack.dailyPerformance.push({
              date: today,
              totalScore: totalScore,
              count: count, // Set count based on the condition
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
          // If the user does not exist in TrackUser, create a new record
          const newTrackUser = new TrackUser({
            email: user.email,
            mName: user.mName,
            type: user.type,
            uid: user.uid,
            dailyPerformance: [
              {
                date: today,
                totalScore: totalScore,
                count: 0, // For the first day, the count can be 0
              },
            ],
            performanceScore: {
              projectCount: user.projectCount,
              courseCount: user.courseCount,
              quizScoreAvg: user.quizScoreAvg,
              averageProgress: user.averageProgress,
              totalScore: totalScore,
            },
          });
        
          await newTrackUser.save();
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
      let maxStreak = user.max_strick || 0; // Longest streak
      let currentStreak = 0; // Current streak

      // Sort dailyPerformance by date
      const sortedPerformance = user.dailyPerformance.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      let previousDate = null;

      // Loop through dailyPerformance
      for (const entry of sortedPerformance) {
        const currentDate = new Date(entry.date);

        if (previousDate) {
          const dayDifference =
            (currentDate - previousDate) / (1000 * 60 * 60 * 24); // Difference in days

          if (dayDifference === 1 && entry.count === 1) {
            // Consecutive day with count = 1
            currentStreak += 1;
          } else if (dayDifference > 1 || entry.count === 0) {
            // Missing date or count = 0
            maxStreak = Math.max(maxStreak, currentStreak); // Update max streak
            currentStreak = entry.count === 1 ? 1 : 0; // Reset or start new streak
          }
        } else {
          // First entry in the loop
          currentStreak = entry.count === 1 ? 1 : 0;
        }

        // Update previousDate for the next iteration
        previousDate = currentDate;
      }

      // Final update for max streak
      maxStreak = Math.max(maxStreak, currentStreak);

      // Save streaks to the user document
      user.strick = currentStreak; // Current streak
      user.max_strick = maxStreak; // Max streak
      await user.save();
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Streaks updated successfully for all users.",
      });
  } catch (error) {
    console.error("Error updating streaks:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update streaks." });
  }
};

export const getAllUsersPerformance = async (req, res) => {
  try {
    const allUsers = await TrackUser.find();

    if (!allUsers || allUsers.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }

    // Calculate points and filter users
    const filteredUsers = allUsers
      .filter(
        (user) =>
          user.performanceScore.courseCount >= 1 &&
          user.performanceScore.averageProgress >= 0
      )
      .map((user) => {
        const points =
          user.performanceScore.projectCount * 10 +
          user.performanceScore.courseCount * 1 +
          (user.performanceScore.quizScoreAvg || 0) +
          (user.testScore || 0) +
          (user.performanceScore.averageProgress || 0);

        return { ...user.toObject(), points };
      })
      .sort((a, b) => b.points - a.points); // Sort by points descending

    if (filteredUsers.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users meet the criteria" });
    }

    res.status(200).json({ success: true, data: filteredUsers });
  } catch (error) {
    console.error(
      "Error filtering and sorting users' performance data:",
      error
    );
    res.status(500).json({ success: false, error: "Server error" });
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
