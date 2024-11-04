import Course from '../models/Course.js';
import nodemailer from 'nodemailer';
import { createApi } from "unsplash-js";

// Initialize Unsplash
const unsplash = createApi({ 
    accessKey: process.env.UNSPLASH_ACCESS_KEY 
});

// Initialize nodemailer transporter
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

export const createCourse = async (req, res) => {
    const { user, content, type, mainTopic } = req.body;

    try {
        // Get relevant image from Unsplash
        const result = await unsplash.search.getPhotos({
            query: mainTopic,
            page: 1,
            perPage: 1,
            orientation: "landscape",
        });
        
        const photos = result.response?.results;
        const photo = photos[0]?.urls?.regular;

        // Create new course
        const newCourse = new Course({ 
            user, 
            content, 
            type, 
            mainTopic, 
            photo,
            progress: 0,
            completed: false,
            date: Date.now()
        });

        await newCourse.save();
        
        res.json({
            success: true,
            message: "Course created successfully",
            courseId: newCourse._id,
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateCourse = async (req, res) => {
    const { content, courseId } = req.body;
    
    try {
        await Course.findOneAndUpdate(
            { _id: courseId },
            { $set: { content: content } }
        );
        
        res.json({ success: true, message: "Course updated successfully" });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const finishCourse = async (req, res) => {
    const { courseId } = req.body;
    
    try {
        await Course.findOneAndUpdate(
            { _id: courseId },
            { 
                $set: { 
                    completed: true, 
                    end: Date.now(),
                    progress: 100
                } 
            }
        );
        
        res.json({ success: true, message: "Course completed successfully" });
    } catch (error) {
        console.error('Error finishing course:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const sendCertificate = async (req, res) => {
    const { html, email } = req.body;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Certification of completion",
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
        console.error('Error sending certificate:', error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

export const getCourses = async (req, res) => {
    try {
        const { userId } = req.query;
        const courses = await Course.find({ user: userId });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find({}, 'user content type mainTopic photo date end completed progress');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateProgress = async (req, res) => {
    const { courseId, progress, completed } = req.body;
    
    try {
        await Course.findOneAndUpdate(
            { _id: courseId },
            {
                $set: {
                    progress: progress,
                    completed: completed || progress === 100
                }
            }
        );
        
        res.json({
            success: true,
            message: "Progress updated successfully"
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};