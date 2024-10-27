//IMPORT
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();
const gis = require("g-i-s");
const youtubesearchapi = require("youtube-search-api");
const { YoutubeTranscript } = require("youtube-transcript");
const {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} = require("@google/generative-ai");
const { createApi } = require("unsplash-js");
const showdown = require("showdown");
const functions = require("firebase-functions");
// const axios = require('axios');

//INITIALIZE
const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-based-training-platfo-ca895.web.app",
  "https://ai-based-training-by-ariba-2d081.web.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));
const PORT = process.env.PORT;
app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongo Db Connected ");
  })
  .catch((err) => console.log(err));

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

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

//SCHEMA
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  mName: String,
  password: String,
  type: String,
  role: { type: String, default: 'nonadmin' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
});

const courseSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true,
    maxlength: [16 * 1024 * 1024, 'Content exceeds maximum allowed length.'] // 16MB limit
  },
  user: String,
  content: { type: String, required: true },
  type: String,
  mainTopic: String,
  photo: String,
  date: { type: Date, default: Date.now },
  end: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
});

// Define a Project schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: String, required: true }, 
  email: { type: String, required: true }, 
  completed: { type: Boolean, default: false, required: true },
  github_url: { type: String },
  dateCreated: { type: Date, default: Date.now },
}, { collection: 'project-users' });

const ProjectTemplateSchema = new mongoose.Schema({
      category: { type: String, required: true },  // Category like 'web', 'android', 'ML', etc.
      title: { type: String, required: true },     // Title of the project
      description: { type: String, required: true }, // Description of the project
      difficulty: { type: String, required: true },  // e.g., 'Beginner', 'Intermediate', 'Advanced'
      time: { type: String, required: true },         // e.g., '1 week', '2 weeks'
      date: { type: Date, default: Date.now },      // Date when the project was added
      assignedTo: { type: [String], default: [] },   // Array to store user IDs who have saved the project
}, { collection: 'main_projects' });

// Create a Project model
const Project = mongoose.model("Project", projectSchema);
const ProjectTemplate = mongoose.model("ProjectTemplate", ProjectTemplateSchema);

//MODEL
const User = mongoose.model("User", userSchema);
const Course = mongoose.model("Course", courseSchema);

//REQUEST

//SIGNUP

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// DASHBOARD DATA
app.post("/api/dashboard", async (req, res) => {
  try {
    // Get total number of users
    const userCount = await User.countDocuments();

    // Get number of admin users
    const adminCount = await User.countDocuments({ role: "admin" });

    const freeCount = await User.countDocuments({ type: "free" });

    const paidCount = await User.countDocuments({ type: "paid" });

    // Get number of regular users (non-admin)
    const regularUserCount = userCount - adminCount;

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
      regularUsers: regularUserCount,
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
});

// GET USERS
app.get("/api/getusers", async (req, res) => {
  try {
    const users = await User.find({}, 'email mName type _id');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET COURSES
app.get("/api/getcourses", async (req, res) => {
  try {
    const courses = await Course.find({}, 'user content type mainTopic photo date end completed');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET ADMINS
app.get("/api/getadmins", async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }, 'email mName');
    const regularUsers = await User.find({ role: { $ne: "admin" } }, 'email mName');
    res.json({ admins, regularUsers });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ADD ADMIN
app.post("/api/addadmin", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "User is already an admin" });
    }

    user.role = "admin";
    console.log("Saved admin")
    await user.save();

    res.json({ success: true, message: "User successfully made admin" });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// REMOVE ADMIN
app.post("/api/removeadmin", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(user.role)
    if (user.role !== "admin") {
      return res.status(400).json({ success: false, message: "User is not an admin" });
    }

    user.role = "nonadmin"; // Changed from "user" to "nonadmin"
    console.log("Saved")
    await user.save();

    res.json({ success: true, message: "Admin status successfully removed" });
  } catch (error) {
    console.error('Error removing admin:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


app.post("/api/signup", async (req, res) => {
  const { email, mName, password, type } = req.body;

  try {
    const estimate = await User.estimatedDocumentCount();
    if (estimate > 0) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.json({
          success: false,
          message: "User with this email already exists",
        });
      }
      const newUser = new User({ email, mName, password, type });
      await newUser.save();
      res.json({
        success: true,
        message: "Account created successfully",
        userId: newUser._id,
      });
    } else {
      const newUser = new User({ email, mName, password, type });
      await newUser.save();
      // const newAdmin = new Admin({ email, mName, type: 'main' });
      // await newAdmin.save();
      res.json({
        success: true,
        message: "Account created successfully",
        userId: newUser._id,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/google/auth", async (req, res) => {
  const { name, email, token } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.password) {
        return res.json({
          success: true,
          message: "Google authentication successful",
          userData: existingUser,
          passwordSetRequired: true,
        });
      }
      return res.json({
        success: true,
        message: "SignIn successful",
        userData: existingUser,
      });
    }
    const newUser = new User({ email, mName: name, resetPasswordToken: token });
    await newUser.save();
    res.json({
      success: true,
      message: "Account created successfully Please set Password",
      userData: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//SIGNIN
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    if (password === user.password) {
      return res.json({
        success: true,
        message: "SignIn successful",
        userData: user,
      });
    }

    res.json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Invalid email or password" });
  }
});

//SEND MAIL
app.post("/api/data", async (req, res) => {
  const receivedData = req.body;

  try {
    const emailHtml = receivedData.html;

    const options = {
      from: process.env.EMAIL,
      to: receivedData.to,
      subject: receivedData.subject,
      html: emailHtml,
    };

    const data = await transporter.sendMail(options);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
});

//FOROGT PASSWORD
app.post("/api/forgot", async (req, res) => {
  const { email, name, company, logo } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: `${name} Password Reset`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
            <html lang="en">
            
              <head></head>
             <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Password Reset<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
             </div>
            
              <body style="margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:rgb(255,255,255);font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:37.5em;margin-left:auto;margin-right:auto;margin-top:40px;margin-bottom:40px;width:465px;border-radius:0.25rem;border-width:1px;border-style:solid;border-color:rgb(234,234,234);padding:20px">
                  <tr style="width:100%">
                    <td>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                        <tbody>
                          <tr>
                            <td><img alt="Vercel" src="${logo}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                          </tr>
                        </tbody>
                      </table>
                      <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Password Reset</h1>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Click on the button below to reset the password for your account ${email}.</p>
                      <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                        <tbody>
                          <tr>
                            <td><a href="${resetLink}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color:rgb(0,0,0);text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>Reset</span></a></td>
                          </tr>
                        </tbody>
                      </table>
                      <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${company}</strong> Team</p></p>
                      </td>
                  </tr>
                </table>
              </body>
            
            </html>`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//FOROGT PASSWORD
app.post("/api/reset-password", async (req, res) => {
  const { password, token } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: true, message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET DATA FROM MODEL
app.post("/api/prompt", async (req, res) => {
  const receivedData = req.body;

  const promptString = receivedData.prompt;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings,
  });

  const prompt = promptString;

  try {
    const result = await model.generateContent(prompt);

    const generatedText = result.response.text();
    res.status(200).json({ generatedText });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET GENERATE THEORY
app.post("/api/generate", async (req, res) => {
  const receivedData = req.body;

  const promptString = receivedData.prompt;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings,
  });

  const prompt = promptString;

  await model
    .generateContent(prompt)
    .then((result) => {
      const response = result.response;
      const txt = response.text();
      const converter = new showdown.Converter();
      const markdownText = txt;
      const text = converter.makeHtml(markdownText);
      res.status(200).json({ text });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

//GET IMAGE
app.post("/api/image", async (req, res) => {
  try {
    const receivedData = req.body;
    
    // Check if prompt is provided
    if (!receivedData || !receivedData.prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    const promptString = receivedData.prompt;

    // Call the GIS function
    gis(promptString, (error, results) => {
      if (error) {
        // Return a 500 error if there's an issue with the GIS API
        console.error("Error fetching image:", error);
        return res.status(500).json({ error: "Failed to generate image" });
      }
      
      if (!results || results.length === 0) {
        // Handle case where no results are found
        return res.status(404).json({ error: "No images found for the given prompt" });
      }

      // Return the first result's URL
      res.status(200).json({ url: results[0].url });
    });
    
  } catch (err) {
    // Catch any unexpected errors
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


//GET VIDEO
app.post("/api/yt", async (req, res) => {
  try {
    const receivedData = req.body;
    const promptString = receivedData.prompt;
    const video = await youtubesearchapi.GetListByKeyword(
      promptString,
      [false],
      [1],
      [{ type: "video" }]
    );
    const videoId = await video.items[0].id;
    res.status(200).json({ url: videoId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET TRANSCRIPT
app.post("/api/transcript", async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  YoutubeTranscript.fetchTranscript(promptString)
    .then((video) => {
      res.status(200).json({ url: video });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

//STORE COURSE
app.post("/api/course", async (req, res) => {
  const { user, content, type, mainTopic } = req.body;

  try {
    const result = await unsplash.search.getPhotos({
      query: mainTopic,
      page: 1,
      perPage: 1,
      orientation: "landscape",
    });
    const photos = result.response?.results;
    const photo = photos[0]?.urls?.regular;
    const newCourse = new Course({ user, content, type, mainTopic, photo });
    await newCourse.save();
    res.json({
      success: true,
      message: "Course created successfully",
      courseId: newCourse._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//UPDATE COURSE
app.post("/api/update", async (req, res) => {
  const { content, courseId, chunkIndex, totalChunks } = req.body;
  
  try {
    if (chunkIndex === 0) {
      // Initialize or reset the content for this course
      await Course.findOneAndUpdate(
        { _id: courseId },
        { $set: { content: "" } }
      );
    }

    // Append the new chunk to the existing content
    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { [`content.${chunkIndex}`]: content } }
    );

    if (chunkIndex === totalChunks - 1) {
      // All chunks received, combine them
      const course = await Course.findById(courseId);
      const fullContent = course.content.join('');
      
      await Course.findOneAndUpdate(
        { _id: courseId },
        { $set: { content: fullContent } }
      );

      res.json({ success: true, message: "Course updated successfully" });
    } else {
      res.json({ success: true, message: "Chunk received successfully" });
    }
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/finish", async (req, res) => {
  const { courseId } = req.body;
  try {
    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { completed: true, end: Date.now() } }
    )
      .then((result) => {
        res.json({ success: true, message: "Course completed successfully" });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//SEND CERTIFICATE
app.post("/api/sendcertificate", async (req, res) => {
  const { html, email } = req.body;

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

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "Certification of completion",
    html: html,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: "Failed to send email" });
    } else {
      res.json({ success: true, message: "Email sent successfully" });
    }
  });
});

//GET ALL COURSES
app.get("/api/courses", async (req, res) => {
  try {
    const { userId } = req.query;
    await Course.find({ user: userId }).then((result) => {
      res.json(result);
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//GET PROFILE DETAILS
app.post("/api/profile", async (req, res) => {
  const { email, mName, password, uid } = req.body;
  try {
    if (password === "") {
      await User.findOneAndUpdate(
        { _id: uid },
        { $set: { email: email, mName: mName } }
      )
        .then((result) => {
          res.json({ success: true, message: "Profile Updated" });
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        });
    } else {
      await User.findOneAndUpdate(
        { _id: uid },
        { $set: { email: email, mName: mName, password: password } }
      )
        .then((result) => {
          res.json({ success: true, message: "Profile Updated" });
        })
        .catch((error) => {
          res
            .status(500)
            .json({ success: false, message: "Internal server error" });
        });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//CHAT
app.post("/api/chat", async (req, res) => {
  const receivedData = req.body;

  const promptString = receivedData.prompt;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings,
  });

  const prompt = promptString;

  await model
    .generateContent(prompt)
    .then((result) => {
      const response = result.response;
      const txt = response.text();
      const converter = new showdown.Converter();
      const markdownText = txt;
      const text = converter.makeHtml(markdownText);
      res.status(200).json({ text });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    });
});

app.post("/api/project-suggestions", async (req, res) => {
  const { prompt } = req.body;

  try {
    // Replace with your AI generation logic or call to another service
    const response = await someAIService.generateProjectSuggestions(prompt);
    res.json({ suggestions: response.data });
  } catch (error) {
    console.error("Error generating project suggestions:", error);
    res.status(500).send("Error generating project suggestions");
  }
});

// Endpoint to save a project
app.post("/api/projectSaved", async (req, res) => {
  const { projectTitle, userId, email, completed = false, github_url } = req.body; // Destructure new fields

  try {
    // Create a new project instance with the updated fields
    const newProject = new Project({
      title: projectTitle,
      userId,
      email,
      completed, // Default to false if not provided
      github_url // Optional field
    });

    // Save the project to the database
    await newProject.save(); 

    res.status(201).json({ message: "Project saved successfully!" });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ message: "Error saving project" });
  }
});

app.get("/api/getprojects", async (req, res) => {
  try {
    // Fetch all projects from the database
    const projects = await Project.find(); 

    if (!projects) {
      return res.status(404).json({ success: false, message: "No projects found" });
    }

    res.json({ success: true, data: projects, message: "Projects fetched successfully" });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get("/api/getmainprojects", async (req, res) => {
  try {
    // Fetch all projects from the database
    const projects = await ProjectTemplate.find(); // Use ProjectTemplate instead of ProjectTemplateSchema

    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: "No projects found" });
    }

    res.json({ success: true, data: projects, message: "Main projects fetched successfully" });
  } catch (error) {
    console.error("Error fetching main projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


app.post("/api/saveProject", async (req, res) => {
  try {
    const { title, category, description, difficulty, time } = req.body;

    // Validate the request body
    if (!title || !category || !description || !difficulty || !time) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Create a new project (remove 'projectSection')
    const newProject = new ProjectTemplate({
      title,
      category,
      description,
      difficulty,
      time
    });

    // Save the project to the database
    await newProject.save();

    res.status(201).json({ success: true, message: "Project saved successfully" });
  } catch (error) {
    console.error("Error saving project:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.put("/api/updateproject", async (req, res) => {
  const { projectTitle, userId } = req.body;
  try {
    console.log("Received data:", req.body); // Log the received data for debugging

    const updatedProject = await ProjectTemplate.findOneAndUpdate(
      { title: projectTitle },
      { $addToSet: { assignedTo: userId } },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.json({ success: true, message: "Project updated successfully", data: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});




const AppPort = process.env.PORT || 5000;
app.listen(AppPort, () => {
  console.log(`Server is running on port ${AppPort}`);
});
exports.api = functions.https.onRequest(app);
