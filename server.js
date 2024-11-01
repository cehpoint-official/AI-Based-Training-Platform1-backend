const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createApi } = require('unsplash-js');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const questionRoutes = require('./routes/questionRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const testReportRoutes = require('./routes/testReportRoutes');
const testUserRoutes = require('./routes/testUserRoutes');
const projectTemplateRoutes = require('./routes/projectTemplateRoutes');

// Import database connection
const connectDB = require('./config/db');

const app = express();

// Connect to database
connectDB();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
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
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

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
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

// Make these available to routes if needed
app.set('transporter', transporter);
app.set('genAI', genAI);
app.set('unsplash', unsplash);

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
 * app.use('/questions', questionRoutes);
 * app.use('/resumes', resumeRoutes);
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
app.use('/api', userRoutes);
app.use('/api', courseRoutes);
app.use('/api', projectRoutes);
app.use('/api', projectTemplateRoutes);
app.use('/api', aiRoutes);
app.use('/api', dashboardRoutes);
app.use('/', questionRoutes);
app.use('/', resumeRoutes);
app.use('/', testReportRoutes);
app.use('/api', testUserRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;