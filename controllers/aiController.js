import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import gis from "g-i-s";
import { createApi } from "unsplash-js";
import youtubesearchapi from "youtube-search-api";
import { YoutubeTranscript } from "youtube-transcript";
import nodemailer from "nodemailer";
import showdown from "showdown";
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// Initialize Unsplash
const unsplash = createApi({ 
    accessKey: process.env.UNSPLASH_ACCESS_KEY 
});

// Define safety settings
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

export const handlePrompt = async (req, res) => {
    //console.log('Received request body:', req.body); // Add logging
    const { prompt, useUserApiKey, userApiKey } = req.body;

    try {
        let model;
        if (useUserApiKey && userApiKey) {
            // console.log('Using user API key'); // Add logging
            const genAIuser = new GoogleGenerativeAI(userApiKey);
            model = genAIuser.getGenerativeModel({ model: "gemini-pro", safetySettings });
        } else {
            // console.log('Using default API key'); // Add logging
            model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        }

        // console.log('Generating content for prompt:', prompt); // Add logging
        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();
        // console.log('Generated response:', generatedText); // Add logging
        res.status(200).json({ generatedText });
    } catch (error) {
        console.error("Error in handlePrompt:", error);
        
        if (error.message.includes('API_KEY_INVALID')) {
            res.status(400).json({
                success: false,
                message: "Invalid API key",
                error: "The provided API key is invalid or has expired. Please check your API key and try again."
            });
        } else if (error.message.includes('PERMISSION_DENIED')) {
            res.status(403).json({
                success: false,
                message: "Permission denied",
                error: "The API key doesn't have permission to access this resource. Please check your API key permissions."
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: error.message
            });
        }
    }
};

export const generateContent = async (req, res) => {
    const { prompt, useUserApiKey, userApiKey } = req.body;

    try {
        let model;
        if (useUserApiKey && userApiKey) {
            const genAIuser = new GoogleGenerativeAI(userApiKey);
            model = genAIuser.getGenerativeModel({ model: "gemini-pro", safetySettings });
        } else {
            model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        }

        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();
        const converter = new showdown.Converter();
        const htmlContent = converter.makeHtml(generatedText);
        res.status(200).json({ text: htmlContent });
    } catch (error) {
        console.error("Error in generateContent:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const handleChat = async (req, res) => {
    const { prompt } = req.body;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            safetySettings,
        });

        const result = await model.generateContent(prompt);
        const txt = result.response.text();
        const converter = new showdown.Converter();
        const text = converter.makeHtml(txt);
        res.status(200).json({ text });
    } catch (error) {
        console.error("Error in handleChat:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getProjectSuggestions = async (req, res) => {
    const { prompt } = req.body;

    try {
        // This is a placeholder. You'll need to implement or integrate with an actual AI service for project suggestions
        const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
        const result = await model.generateContent(`Generate project suggestions based on: ${prompt}`);
        const suggestions = result.response.text().split('\n').filter(suggestion => suggestion.trim() !== '');
        res.json({ suggestions });
    } catch (error) {
        console.error("Error generating project suggestions:", error);
        res.status(500).send("Error generating project suggestions");
    }
};

export const getImage = async (req, res) => {
    const { prompt } = req.body;

    try {
        // First attempt to get image from GIS
        const results = await new Promise((resolve, reject) => {
            gis(prompt, (error, results) => {
                if (error || !results || results.length === 0) {
                    reject("No results from GIS");
                } else {
                    resolve(results);
                }
            });
        });

        // If GIS returns results, send them
        res.status(200).json({ url: results[0].url });
    } catch (gisError) {
        // console.log("Error with GIS:", gisError);

        // If GIS fails, fall back to Unsplash API
        try {
            const unsplashResponse = await unsplash.search.getPhotos({
                query: prompt,
                page: 1,
                perPage: 1,
                orientation: "landscape",
            });

            if (unsplashResponse.response.results.length > 0) {
                res.status(200).json({ url: unsplashResponse.response.results[0].urls.regular });
            } else {
                // If Unsplash returns no results, send a placeholder image
                const defaultImageUrl = "https://via.placeholder.com/150";
                res.status(200).json({ url: defaultImageUrl });
            }
        } catch (unsplashError) {
            console.error("Error with Unsplash:", unsplashError);
            // If both GIS and Unsplash fail, send a placeholder image
            const defaultImageUrl = "https://via.placeholder.com/150";
            res.status(200).json({ url: defaultImageUrl });
        }
    }
};


export const getYouTubeVideo = async (req, res) => {
    const { prompt } = req.body;

    try {
        const video = await youtubesearchapi.GetListByKeyword(prompt, [false], [1], [{ type: "video" }]);
        const videoId = video.items[0].id;
        res.status(200).json({ url: videoId });
    } catch (error) {
        console.error("Error in getYouTubeVideo:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getYouTubeTranscript = async (req, res) => {
    const { prompt } = req.body;

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(prompt);
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transcript is disabled or not available for this video.",
            });
        }
        res.status(200).json({ url: transcript });
    } catch (error) {
        if (error.message.includes("Transcript is disabled")) {
            return res.status(403).json({
                success: false,
                message: "Transcript is disabled on this video.",
            });
        }
        console.error("Error in getYouTubeTranscript:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const sendEmail = async (req, res) => {
    const { html, to, subject } = req.body;

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

    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        res.status(200).json(info);
    } catch (error) {
        console.error("Error in sendEmail:", error);
        res.status(400).json(error);
    }
};

export const aiGeneratedExplanation = async (req, res) => {
    const { prompt, useUserApiKey, apiKey } = req.body;
  
    try {
      // Initialize AI model based on user-provided API key or default server key
      let model;
      if (useUserApiKey && apiKey) {
        const genAIuser = new GoogleGenerativeAI(apiKey); // Initialize with user's API key
        model = genAIuser.getGenerativeModel({ model: "gemini-pro", safetySettings });
      } else {
        model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings }); // Default server model
      }
  
      // Generate the explanation based on the prompt
      const result = await model.generateContent(prompt);
      const generatedExplanation = result.response.text();
  
      // Convert Markdown to HTML using Showdown
      const converter = new showdown.Converter();
      const htmlExplanation = converter.makeHtml(generatedExplanation);
  
      // Respond with the AI-generated explanation in HTML
      res.status(200).json({ success: true, explanation: htmlExplanation });
    } catch (error) {
      console.error("Error in aiGeneratedExplanation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate explanation. Please try again.",
        error: error.message,
      });
    }
  };