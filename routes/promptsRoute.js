import { Router } from "express";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { genAI } from "../config/clients.js";
import axios from "axios";

import showdown from "showdown";

const promptRouter = Router();

promptRouter.post("/prompt", async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  const useUserApiKey = receivedData.useUserApiKey || false;
  const userApiKey = receivedData.userApiKey || null;

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
  let genAIuser;
  if (useUserApiKey && userApiKey !== null) {
    genAIuser = new GoogleGenerativeAI(userApiKey);
    const model = genAIuser.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    const prompt = promptString;

    try {
      const result = await model.generateContent(prompt);
      const generatedText = result.response.text();
      res.status(200).json({ generatedText });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    const prompt = promptString;
    try {
      const result = await model.generateContent(prompt);
      const generatedText = result.response.text();
      res.status(200).json({ generatedText });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
});

//GET GENERATE THEORY
promptRouter.post("/generate", async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  const useUserApiKey = receivedData.useUserApiKey || false;
  const userApiKey = receivedData.userApiKey || null;
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
  let genAIuser;
  if (useUserApiKey && userApiKey !== null) {
    genAIuser = new GoogleGenerativeAI(userApiKey);
    const model = genAIuser.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    const prompt = promptString;

    try {
      await model.generateContent(prompt).then((result) => {
        const response = result.response;
        const txt = response.text();
        const converter = new showdown.Converter();
        const markdownText = txt;
        const text = converter.makeHtml(markdownText);
        res.status(200).json({ text });
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    try {
      const prompt = promptString;
      await model.generateContent(prompt).then((result) => {
        const response = result.response;
        const txt = response.text();
        const converter = new showdown.Converter();
        const markdownText = txt;
        const text = converter.makeHtml(markdownText);
        res.status(200).json({ text });
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
});

//CHAT
promptRouter.post("/chat", async (req, res) => {
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

//SEARCH YOUTUBE VIDEOS
promptRouter.post("/search-youtube", async (req, res) => {
  const { query, maxResults = 3 } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query parameter is required",
    });
  }

  // YouTube API key - in production, this should be stored in environment variables
  // This is just a placeholder - the client needs to provide their own YouTube API key
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY) {
    // If no YouTube API key is available, use AI to generate likely video titles and create fake links
    // This is useful for development without having a YouTube API key
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = `Generate ${maxResults} likely YouTube video URLs for the topic: "${query}". 
      Format the response as a JSON array of video links. Make them realistic looking YouTube URLs with video IDs. 
      For example: ["https://www.youtube.com/watch?v=abcdef12345", "https://www.youtube.com/watch?v=ghijk67890"]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract the JSON array from the response
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          const videoLinks = JSON.parse(jsonMatch[0]);
          return res.status(200).json({ videoLinks });
        } catch (error) {
          console.error("Error parsing generated JSON:", error);
        }
      }

      // Fallback if JSON parsing fails
      return res.status(200).json({
        videoLinks: [
          `https://www.youtube.com/watch?v=demo1ForTopic_${encodeURIComponent(
            query
          )}`,
          `https://www.youtube.com/watch?v=demo2ForTopic_${encodeURIComponent(
            query
          )}`,
          `https://www.youtube.com/watch?v=demo3ForTopic_${encodeURIComponent(
            query
          )}`,
        ],
      });
    } catch (error) {
      console.error("Error generating YouTube links:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate YouTube links",
      });
    }
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: maxResults,
          q: query,
          type: "video",
          key: YOUTUBE_API_KEY,
          videoEmbeddable: true,
          relevanceLanguage: "en",
        },
      }
    );

    const videoLinks = response.data.items.map(
      (item) => `https://www.youtube.com/watch?v=${item.id.videoId}`
    );

    res.status(200).json({ videoLinks });
  } catch (error) {
    console.error(
      "YouTube API error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch YouTube videos",
    });
  }
});

export default promptRouter;
