import { Router } from "express";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { genAI } from "../config/clients.js";

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
      safetySettings
    })
    const prompt = promptString;

    try {
      const result = await model.generateContent(prompt);
      const generatedText = result.response.text();
      res.status(200).json({ generatedText });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
  else {
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
      res.status(500).json({ success: false, message: "Internal server error" });
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
      safetySettings
    })
    const prompt = promptString;

    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
  else {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    try {
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
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Internal server error" });
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

export default promptRouter;
