const Question = require('../models/Question');
const { generateAdditionalQuestionsAI } = require('../utils/aiQuestionGenerator');

exports.fetchQuestions = async (req, res) => {
    console.log("Received request body:", req.body);
    const { skills } = req.body;

    try {
        // Validate skills array
        if (!skills || !Array.isArray(skills)) {
            console.error("Invalid skills format received:", skills);
            return res.status(400).json({ error: 'Invalid skills array' });
        }

        // Clean and normalize skills array
        const cleanedSkills = skills
            .map(skill => skill.trim())
            .filter(skill => skill && typeof skill === 'string' && skill.length > 0)
            .map(skill => skill.toLowerCase());

        console.log("Cleaned skills array:", cleanedSkills);

        const allQuestions = [];

        // Fetch questions from MongoDB
        try {
            const dbQuestions = await Question.find({ 
                skills: { $in: cleanedSkills } 
            }).limit(10);

            console.log(`Found ${dbQuestions.length} questions in database`);
            allQuestions.push(...dbQuestions);
        } catch (dbError) {
            console.error("Database query error:", dbError);
            // Continue execution even if DB fails
        }

        // Generate AI questions if needed
        if (allQuestions.length < 5) {
            try {
                console.log("Generating additional AI questions...");
                const additionalQuestions = await generateAdditionalQuestionsAI(
                    cleanedSkills, 
                    5 - allQuestions.length
                );
                allQuestions.push(...additionalQuestions);
            } catch (aiError) {
                console.error("AI generation error:", aiError);
                // Continue with whatever questions we have
            }
        }

        // Fallback questions if no questions are available
        if (allQuestions.length === 0) {
            const fallbackQuestions = [
                {
                    id: 'fallback_1',
                    question: 'Explain your approach to problem-solving in your primary programming language.',
                    type: 'text',
                    skills: ['problem-solving'],
                },
                {
                    id: 'fallback_2',
                    question: 'Describe a challenging project you worked on and how you overcame the difficulties.',
                    type: 'text',
                    skills: ['project-management'],
                }
            ];
            allQuestions.push(...fallbackQuestions);
        }

        console.log(`Sending ${allQuestions.length} questions back to client`);
        return res.status(200).json(allQuestions);

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};