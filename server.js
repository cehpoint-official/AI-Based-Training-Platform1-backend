import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createApi } from "unsplash-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { genAI } from "./config/clients.js";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import testReportRoutes from "./routes/testReportRoutes.js";
import testUserRoutes from "./routes/testUserRoutes.js";
import projectTemplateRoutes from "./routes/projectTemplateRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import topcandidateRoutes from "./routes/topCandidateRoutes.js";
import * as functions from "firebase-functions";

// Import database connection
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// Connect to database
connectDB();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://ai-based-training-platfo-ca895.web.app",
  "https://ai-based-training-by-ariba-2d081.web.app",
  "https://ai-skill-enhancement-and-job-readiness.cehpoint.co.in",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Google AI and Unsplash API initialization
// const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

// Make these available to routes if needed
app.set("transporter", transporter);
app.set("genAI", genAI);
app.set("unsplash", unsplash);

/**
 * ---------------------------------------------------------------
 *                              IMPORTANT
 * ---------------------------------------------------------------
 * Standard MVC route structure for reference:
 * app.use('/api/users', userRoutes);
 * app.use('/api/courses', courseRoutes);
 * app.use('/api/projects', projectRoutes);
 * app.use('/api/ai', aiRoutes);
 * app.use('/api/dashboard', dashboardRoutes);
 * app.use('api/questions', questionRoutes);
 * app.use('api/resumes', resumeRoutes);
 * app.use('api/quiz', quizRoutes);
 * app.use('/api/topcandidate', quizRoutes);
 *
 * Current implementation uses simplified routes ('/api') instead of standard MVC structure
 * ('/api/resource') because:
 * 1. Frontend was developed first with simplified endpoints (e.g., '/api/signin' instead of '/api/users/signin')
 * 2. Maintaining consistency with existing frontend API calls
 * 3. Changing to standard MVC structure would require updating all frontend API endpoints
 *
 * Note: If refactoring, both frontend and backend endpoints must be updated together
 */

// Current implementation to match existing frontend endpoints:
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", projectRoutes);
app.use("/api", projectTemplateRoutes);
app.use("/api", aiRoutes);
app.use("/api", dashboardRoutes);
app.use("/", questionRoutes);
app.use("/", resumeRoutes);
app.use("/", testReportRoutes);
app.use("/api", testUserRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api", topcandidateRoutes);

// Add endpoint for YouTube search
app.post("/api/search-youtube", async (req, res) => {
  const { query, maxResults = 3 } = req.body;

  console.log("Received YouTube search request for:", query);

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query parameter is required",
    });
  }

  // Use AI to generate likely video titles and create links
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Generate ${maxResults} likely YouTube video URLs for the topic: "${query}". 
    Format the response as a JSON array of video links. Make them realistic looking YouTube URLs with video IDs. 
    For example: ["https://www.youtube.com/watch?v=abcdef12345", "https://www.youtube.com/watch?v=ghijk67890"]`;

    console.log("Sending prompt to Gemini:", prompt);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("Raw response from Gemini:", text);

    // Extract the JSON array from the response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const videoLinks = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed YouTube links:", videoLinks);
        return res.status(200).json({ videoLinks });
      } catch (error) {
        console.error("Error parsing generated JSON:", error);
      }
    }

    // Create default YouTube links since parsing failed
    const encodedQuery = encodeURIComponent(query);
    const videoLinks = [
      `https://www.youtube.com/results?search_query=${encodedQuery}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `learn ${query}`
      )}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${query} tutorial for beginners`
      )}`,
    ];

    console.log("Using fallback YouTube links:", videoLinks);
    return res.status(200).json({ videoLinks });
  } catch (error) {
    console.error("Error generating YouTube links:", error);

    // Return search links as fallback
    const encodedQuery = encodeURIComponent(query);
    const videoLinks = [
      `https://www.youtube.com/results?search_query=${encodedQuery}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `learn ${query}`
      )}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${query} tutorial for beginners`
      )}`,
    ];

    console.log("Error fallback YouTube links:", videoLinks);
    return res.status(200).json({ videoLinks });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token or no token provided",
    });
  }

  if (err.name === "MongoError" && err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate key error",
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Rate limiting middleware
const rateLimit = (maxRequests, timeWindow) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - timeWindow;

    // Clean old requests
    requests.forEach((timestamp, key) => {
      if (timestamp < windowStart) requests.delete(key);
    });

    // Get requests in current window
    const requestCount = (requests.get(ip) || []).filter(
      (timestamp) => timestamp > windowStart
    ).length;

    if (requestCount >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
      });
    }

    // Add current request
    const timestamps = requests.get(ip) || [];
    timestamps.push(now);
    requests.set(ip, timestamps);

    next();
  };
};

// Apply rate limiting to sensitive routes
app.use("/api/signin", rateLimit(5, 60 * 1000)); // 5 requests per minute
app.use("/api/signup", rateLimit(3, 60 * 1000)); // 3 requests per minute
app.use("/api/prompt", rateLimit(10, 60 * 1000)); // 10 requests per minute

const PORT = process.env.PORT || 5000;

// For local development
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the app wrapped in a Firebase function
export const api = functions.https.onRequest(app);
