import Question from "../models/Question.js";
import { generateAdditionalQuestionsAI } from "../utils/aiQuestionGenerator.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genericQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/genericFallbackQuestions.json')));
const skillSpecificQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/skillSpecificQuestions.json')));
const nonTechnicalQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nonTechnicalQuestions.json')));
const generalTechnicalQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/generalTechnicalQuestions.json')));


function getRandomQuestions(questionsArray, count) {
    const shuffled = questionsArray.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export const fetchQuestions = async (req, res) => {
  // console.log("Received request body:", req.body);
  const { skills } = req.body;

  try {
    // Validate skills array
    if (!skills || !Array.isArray(skills)) {
      console.error("Invalid skills format received:", skills);
      return res.status(400).json({ error: "Invalid skills array" });
    }

    // Clean and normalize skills array
    const cleanedSkills = skills
      .map((skill) => skill.trim())
      .filter((skill) => skill && typeof skill === "string" && skill.length > 0)
      .map((skill) => skill.toLowerCase());

    // console.log("Cleaned skills array:", cleanedSkills);

    const allQuestions = [];

    // Fetch questions from MongoDB
    try {
      const dbQuestions = await Question.find({
        skills: { $in: cleanedSkills },
      }).limit(10);

      // console.log(`Found ${dbQuestions.length} questions in database`);
      allQuestions.push(...dbQuestions);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      // Continue execution even if DB fails
    }

    // Generate AI questions if needed
    if (allQuestions.length < 5) {
      try {
        // console.log("Generating additional AI questions...");
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
    if (allQuestions.length === 0 || allQuestions.length < 5) {
        // Step 1: Add 2 random generic questions
        allQuestions.push(...getRandomQuestions(genericQuestions, 2));
    
        // Step 2: Add skill-specific questions for each skill
        cleanedSkills.forEach((skill) => {
            const skillLower = skill.toLowerCase();
            if (skillSpecificQuestions[skillLower]) {
                allQuestions.push(...getRandomQuestions(skillSpecificQuestions[skillLower], 2));
            }
        });
    
        // Step 3: Add random non-technical questions if non-technical skills only
        if (allQuestions.length < 5 && cleanedSkills.every(skill => !skillSpecificQuestions[skill.toLowerCase()])) {
            allQuestions.push(...getRandomQuestions(nonTechnicalQuestions, 3));
        }
    
        // Step 4: Add general technical questions if still fewer than 5 questions
        if (allQuestions.length < 5) {
            allQuestions.push(...getRandomQuestions(generalTechnicalQuestions, 3));
        }
    
        // Step 5: Limit to a maximum of 10 questions
        if (allQuestions.length > 10) {
            allQuestions = allQuestions.slice(0, 10);
        }
    }

    // console.log(`Sending ${allQuestions.length} questions back to client`);
    return res.status(200).json(allQuestions);
  } catch (error) {
    // console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
