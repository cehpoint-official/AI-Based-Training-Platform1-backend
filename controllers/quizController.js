import Quiz from "../models/Quiz.js";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
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

export const createQuizResult = async (req, res) => {
  const { userId, courseId, score } = req.body;

  // Validate input data
  if (!userId || !courseId || score === undefined) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Create a new Quiz document
    const newQuizResult = new Quiz({
      userId,
      courseId,
      score,
    });

    // Save the document to the database
    await newQuizResult.save();

    // Return the created quiz result
    res.status(201).json(newQuizResult);
  } catch (error) {
    console.error("Error saving quiz result:", error);
    res.status(500).json({ error: "Failed to save quiz result" });
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const results = await Quiz.find();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    res.status(500).json({ error: "Failed to fetch quiz results" });
  }
};

export const getUserQuizResults = async (req, res) => {
  const { userId } = req.params;

  try {
    const results = await Quiz.find({ userId });
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching user quiz results:", error);
    res.status(500).json({ error: "Failed to fetch user quiz results" });
  }
};

export const getQuizData = async (req, res) => {
  const { prompt, useUserApiKey, apiKey } = req.body;
  try {
    let model;
    if (useUserApiKey && apiKey) {
      const genAIuser = new GoogleGenerativeAI(apiKey);
      model = genAIuser.getGenerativeModel({
        model: "gemini-pro",
        safetySettings,
      });
    } else {
      model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
    }

    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();
    res.status(200).json({ text: generatedText });
  } catch (error) {
    // console.error("Error in generateContent:", error);
    res.status(500).json({ success: false, message: "Error in generating" });
  }
};
