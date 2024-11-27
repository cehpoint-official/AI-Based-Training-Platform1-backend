import Question from "../models/Question.js";
import { generateAdditionalQuestionsAI } from "../utils/aiQuestionGenerator.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nonTechnicalQuestions = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/nonTechnicalQuestions.json'))
);

function getRandomQuestions(questionsArray, count) {
  const shuffled = questionsArray.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const fetchQuestions = async (req, res) => {
  const { skills } = req.body;

  try {
    // Validate skills array
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: "Invalid skills array" });
    }

    // Clean and normalize skills array
    const cleanedSkills = skills
      .map(skill => skill.trim())
      .filter(skill => skill && typeof skill === "string" && skill.length > 0)
      .map(skill => skill.toLowerCase());

    let allQuestions = [];

    // Fetch questions from MongoDB
    try {
      const dbQuestions = await Question.find({
        skills: { $in: cleanedSkills },
      }).limit(10);

      allQuestions.push(...dbQuestions);
    } catch (dbError) {
      console.error("Database query error:", dbError);
    }

   // Generate additional AI questions if needed
    if (allQuestions.length < 10) {
      try {
        const additionalQuestions = await generateAdditionalQuestionsAI(
          cleanedSkills,
          10 - allQuestions.length
        );
        allQuestions.push(...additionalQuestions);
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    // Ensure exactly 10 technical questions
    if (allQuestions.length > 10) {
      allQuestions = allQuestions.slice(0, 10);
    }

    // Add 5 random non-technical questions
    const nonTechQuestions = getRandomQuestions(nonTechnicalQuestions, 5);
    allQuestions.push(...nonTechQuestions);

    return res.status(200).json(allQuestions);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
