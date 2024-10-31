const TestUser = require('../models/TestUser');

exports.createTestUser = async (req, res) => {
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
        extractedText = ""
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
            status: "processed" // Indicates that parsing is complete
        });

        await newTestUser.save();

        res.status(201).json({
            success: true,
            message: "Test user added successfully",
            data: newTestUser
        });
    } catch (error) {
        console.error("Error adding test user:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};