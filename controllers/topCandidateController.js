import mongoose from "mongoose";
import Course from "../models/Course.js";
import Project from "../models/Project.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

export const getTopCandidate_admin = async (req, res) => {
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
        $match: {
          projects: { $ne: [] }, // Only users with at least one project
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
          // Calculate average progress
          averageProgress: {
            $cond: {
              if: { $gt: [{ $size: "$courses" }, 0] },
              then: { $avg: "$courses.progress" },
              else: 0,
            },
          },
          courseDetails: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                courseId: "$$course._id", // MongoDB _id of the course
                courseProgress: "$$course.progress", // Progress per course
                courseQuizScore: {
                  $let: {
                    vars: {
                      matchedQuiz: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$quizzes",
                              as: "quiz",
                              cond: {
                                $eq: [
                                  "$$quiz.courseId",
                                  { $toString: "$$course._id" },
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$matchedQuiz.score", 0] },
                  },
                },
              },
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
          courseDetails: 1, // Each course with its courseProgress and courseQuizScore
        },
      },
    ]);

    // console.log(usersWithDetails); // Debugging output to check results

    res.status(200).json({ success: true, data: usersWithDetails });
  } catch (error) {
    console.error("Error fetching top candidates:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getTopCandidate_user = async (req, res) => {
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
      // {
      //   $match: {
      //     projects: { $ne: [] }, // Only users with at least one project
      //   },
      // },
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
          // Calculate average progress
          averageProgress: {
            $cond: {
              if: { $gt: [{ $size: "$courses" }, 0] },
              then: { $avg: "$courses.progress" },
              else: 0,
            },
          },
          courseDetails: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                courseId: "$$course._id", // MongoDB _id of the course
                courseProgress: "$$course.progress", // Progress per course
                courseQuizScore: {
                  $let: {
                    vars: {
                      matchedQuiz: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$quizzes",
                              as: "quiz",
                              cond: {
                                $eq: [
                                  "$$quiz.courseId",
                                  { $toString: "$$course._id" },
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ["$$matchedQuiz.score", 0] },
                  },
                },
              },
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
          courseDetails: 1, // Each course with its courseProgress and courseQuizScore
        },
      },
    ]);

    // console.log(usersWithDetails); // Debugging output to check results

    res.status(200).json({ success: true, data: usersWithDetails });
  } catch (error) {
    console.error("Error fetching top candidates:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


