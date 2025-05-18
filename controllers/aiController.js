import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import gis from "g-i-s";
import { compareTwoStrings } from "string-similarity";
import { createApi } from "unsplash-js";
import youtubesearchapi from "youtube-search-api";
import { YoutubeTranscript } from "youtube-transcript";
import nodemailer from "nodemailer";
import showdown from "showdown";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
// Initialize Unsplash
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
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

// API key management
const keyUsage = new Map();
const KEY_RESET_INTERVAL = 60 * 1000; // 1 minute (Gemini's standard window)
const MAX_REQUESTS_PER_KEY = 60; // Gemini's limit per minute
const COOLDOWN_PERIOD = 2000; // 2 second cooldown after hitting limit

// Load system API keys from environment
const systemApiKeys = process.env.API_KEYS
  ? process.env.API_KEYS.split(",").filter((key) => key && key.trim())
  : [process.env.API_KEY].filter((key) => key && key.trim());

// Function to check and update key usage
const canUseKey = (apiKey) => {
  if (!apiKey) return false;

  const now = Date.now();
  const keyData = keyUsage.get(apiKey) || {
    count: 0,
    lastReset: now,
    cooldownUntil: 0,
    consecutiveFailures: 0,
  };

  // Check if key is in cooldown
  if (keyData.cooldownUntil > now) {
    return false;
  }

  // Reset count if interval has passed
  if (now - keyData.lastReset >= KEY_RESET_INTERVAL) {
    keyData.count = 0;
    keyData.lastReset = now;
    keyData.cooldownUntil = 0;
    keyData.consecutiveFailures = 0;
  }

  // Check if key can be used
  if (keyData.count < MAX_REQUESTS_PER_KEY) {
    keyData.count++;
    keyUsage.set(apiKey, keyData);
    return true;
  }

  // Set cooldown period when limit is reached
  keyData.consecutiveFailures++;
  keyData.cooldownUntil =
    now + COOLDOWN_PERIOD * Math.pow(2, keyData.consecutiveFailures - 1);
  keyUsage.set(apiKey, keyData);
  return false;
};

// Function to mark a key as failed
const markKeyAsFailed = (apiKey) => {
  if (!apiKey) return;

  const keyData = keyUsage.get(apiKey);
  if (keyData) {
    keyData.consecutiveFailures++;
    keyData.cooldownUntil =
      Date.now() +
      COOLDOWN_PERIOD * Math.pow(2, keyData.consecutiveFailures - 1);
    keyUsage.set(apiKey, keyData);
  }
};

// Function to get next available API key with load balancing
const getAvailableKey = (excludeKey = null) => {
  // Filter out the excluded key and sort remaining keys by usage count
  const availableKeys = systemApiKeys
    .filter((key) => key !== excludeKey)
    .sort((a, b) => {
      const usageA = keyUsage.get(a)?.count || 0;
      const usageB = keyUsage.get(b)?.count || 0;
      return usageA - usageB;
    });

  // Try to find an available key
  for (const key of availableKeys) {
    if (canUseKey(key)) {
      return key;
    }
  }

  // If no key is immediately available, find the one that will be available soonest
  const now = Date.now();
  return availableKeys.reduce((bestKey, currentKey) => {
    const currentData = keyUsage.get(currentKey);
    const bestData = keyUsage.get(bestKey);

    if (!currentData) return currentKey;
    if (!bestData) return bestKey;

    return (currentData.cooldownUntil || 0) < (bestData.cooldownUntil || 0)
      ? currentKey
      : bestKey;
  }, availableKeys[0]);
};

// Extract retry delay from Gemini API error response
const extractRetryDelay = (error) => {
  try {
    // Look for RetryInfo in the error details
    const retryInfo = error.errorDetails?.find(
      (detail) => detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    );

    if (retryInfo?.retryDelay) {
      // Convert "19s" format to milliseconds
      const seconds = parseInt(retryInfo.retryDelay.replace("s", ""));
      return seconds * 1000;
    }
  } catch (e) {
    console.error("Error extracting retry delay:", e);
  }

  // Default fallback delay
  return 20000; // 20 seconds
};

// Fallback generator when API fails
const generateFallbackCourseStructure = (mainTopic, subtopics = []) => {
  // Default topics if none provided
  const defaultSubtopics = [
    "Introduction",
    "Basics",
    "Intermediate",
    "Advanced",
    "Projects",
  ];
  const topicsToUse = subtopics.length > 0 ? subtopics : defaultSubtopics;

  const courseStructure = {
    [mainTopic.toLowerCase()]: [
      {
        title: "Getting Started",
        subtopics: [
          {
            title: "Introduction to " + mainTopic,
            theory: "",
            youtube: "",
            image: "",
            done: false,
            aiExplanation: "",
          },
        ],
      },
    ],
  };

  // Add sections based on subtopics
  const sections = ["Fundamentals", "Core Concepts", "Advanced Topics"];
  let sectionIndex = 0;

  // Group subtopics into sections (3 subtopics per section)
  for (let i = 0; i < topicsToUse.length; i += 3) {
    const sectionTitle =
      i === 0
        ? "Fundamentals"
        : i < topicsToUse.length - 3
        ? "Core Concepts"
        : "Advanced Topics";

    const section = {
      title: sectionTitle,
      subtopics: [],
    };

    // Add up to 3 subtopics per section
    for (let j = 0; j < 3 && i + j < topicsToUse.length; j++) {
      section.subtopics.push({
        title: topicsToUse[i + j],
        theory: "",
        youtube: "",
        image: "",
        done: false,
        aiExplanation: "",
      });
    }

    courseStructure[mainTopic.toLowerCase()].push(section);
  }

  // Add final project section
  courseStructure[mainTopic.toLowerCase()].push({
    title: "Projects and Applications",
    subtopics: [
      {
        title: mainTopic + " Project",
        theory: "",
        youtube: "",
        image: "",
        done: false,
        aiExplanation: "",
      },
    ],
  });

  return JSON.stringify(courseStructure);
};

export const handlePrompt = async (req, res) => {
  const {
    prompt,
    mainTopic,
    useUserApiKey,
    userApiKey,
    type,
    subtopics = [],
  } = req.body;
  let currentKey = userApiKey || getAvailableKey();
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // Track used keys to avoid reusing failed ones
  const failedKeys = new Set();

  while (retryCount < MAX_RETRIES) {
    try {
      let model;
      if (useUserApiKey && userApiKey) {
        const genAIuser = new GoogleGenerativeAI(userApiKey);
        model = genAIuser.getGenerativeModel({
          model: "gemini-1.5-flash", // Use flash instead of pro to reduce token usage
          safetySettings,
        });
      } else {
        if (!currentKey) {
          console.log("No API keys available, using fallback generator");
          return res.json({
            success: true,
            content: generateFallbackCourseStructure(mainTopic, subtopics),
            fromFallback: true,
          });
        }

        // Try with flash model first to reduce quota usage
        const genAIInstance = new GoogleGenerativeAI(currentKey);
        model = genAIInstance.getGenerativeModel({
          model: "gemini-1.5-flash", // Use flash instead of pro
          safetySettings,
        });
      }

      // Use a simpler prompt to reduce token usage
      const simplifiedPrompt = `Create a structured course outline for "${mainTopic}" with 10 topics. Format as JSON: {"${mainTopic}": [{"title": "Topic", "subtopics": [{"title": "Subtopic", "theory": "", "youtube": "", "image": "", "done": false, "aiExplanation": ""}]}]}`;

      const result = await model.generateContent(simplifiedPrompt);
      const generatedText = result.response.text();

      // Clean the response text - LLMs often add backticks or markdown code blocks
      const cleanJsonText = generatedText
        .replace(/^```json/m, "") // Remove json code block start
        .replace(/^```/m, "") // Remove generic code block start
        .replace(/```$/m, "") // Remove code block end
        .trim(); // Remove any whitespace

      // Try to parse as JSON, if it fails, use the fallback
      try {
        // Validate response is proper JSON
        const parsedJson = JSON.parse(cleanJsonText);
        return res.json({ success: true, content: JSON.stringify(parsedJson) });
      } catch (jsonError) {
        console.error("Error parsing generated JSON:", jsonError);
        console.error("Generated text:", generatedText);

        // Try one more approach: extract anything that looks like JSON
        try {
          // Look for content between curly braces with the main topic
          const jsonRegex = new RegExp(
            `\\{\\s*"${mainTopic.toLowerCase()}"\\s*:.*\\}`,
            "s"
          );
          const match = cleanJsonText.match(jsonRegex);

          if (match && match[0]) {
            // Try parsing just the matched portion
            const extractedJson = JSON.parse(match[0]);
            console.log("Successfully extracted JSON from text");
            return res.json({
              success: true,
              content: JSON.stringify(extractedJson),
              wasFixed: true,
            });
          }
        } catch (extractError) {
          console.error("Failed to extract valid JSON:", extractError);
        }

        // If all parsing attempts fail, use the fallback
        return res.json({
          success: true,
          content: generateFallbackCourseStructure(mainTopic, subtopics),
          fromFallback: true,
        });
      }
    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);

      if (
        error.message?.includes("quota") ||
        error.message?.includes("rate") ||
        error.status === 429
      ) {
        retryCount++;
        // Mark the current key as failed
        markKeyAsFailed(currentKey);
        failedKeys.add(currentKey);

        if (!useUserApiKey) {
          // Try to get a different system API key that hasn't failed
          const availableKeys = systemApiKeys.filter(
            (key) => !failedKeys.has(key)
          );

          if (availableKeys.length > 0) {
            // Sort by usage count and get the least used one
            const nextKey = availableKeys.sort((a, b) => {
              const usageA = keyUsage.get(a)?.count || 0;
              const usageB = keyUsage.get(b)?.count || 0;
              return usageA - usageB;
            })[0];

            if (nextKey && nextKey !== currentKey) {
              currentKey = nextKey;
              continue;
            }
          }
        }

        if (retryCount >= MAX_RETRIES - 1) {
          console.log("All retries failed, using fallback generator");
          return res.json({
            success: true,
            content: generateFallbackCourseStructure(mainTopic, subtopics),
            fromFallback: true,
          });
        }

        // Wait before retry
        const delay = error.errorDetails
          ? extractRetryDelay(error)
          : RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Waiting for ${delay / 1000} seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.log("Non-quota error, using fallback generator");
        return res.json({
          success: true,
          content: generateFallbackCourseStructure(mainTopic, subtopics),
          fromFallback: true,
        });
      }
    }
  }

  // If we've reached this point, all retries failed
  console.log("All retries failed, using fallback generator");
  return res.json({
    success: true,
    content: generateFallbackCourseStructure(mainTopic, subtopics),
    fromFallback: true,
  });
};

export const generateContent = async (req, res) => {
  const { prompt, useUserApiKey, userApiKey } = req.body;

  try {
    let model;
    if (useUserApiKey && userApiKey) {
      const genAIuser = new GoogleGenerativeAI(userApiKey);
      model = genAIuser.getGenerativeModel({
        model: "gemini-1.5-pro",
        safetySettings,
      });
    } else {
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        safetySettings,
      });
    }

    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();
    const converter = new showdown.Converter();
    const htmlContent = converter.makeHtml(generatedText);
    res.status(200).json({ text: htmlContent });
  } catch (error) {
    // console.error("Error in generateContent:", error);
    res.status(500).json({ success: false, message: "Error in generating" });
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
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      safetySettings,
    });
    const result = await model.generateContent(
      `Generate project suggestions based on: ${prompt}`
    );
    const suggestions = result.response
      .text()
      .split("\n")
      .filter((suggestion) => suggestion.trim() !== "");
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
        res
          .status(200)
          .json({ url: unsplashResponse.response.results[0].urls.regular });
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
  // console.log(prompt);
  try {
    const results = await youtubesearchapi.GetListByKeyword(prompt, false, 5, [
      { type: "video" },
    ]);
    const videoData = results.items.map((video) => ({
      id: video.id,
      title: video.title,
    }));
    const similarities = videoData.map((video) => ({
      id: video.id,
      title: video.title,
      similarity: compareTwoStrings(prompt, video.title),
    }));
    //   console.log(similarities);
    const mostRelevantVideo = similarities.reduce((prev, current) =>
      current.similarity > prev.similarity ? current : prev
    );
    //   console.log("Most relevant video:", mostRelevantVideo);
    const videoId = mostRelevantVideo.id;
    res.status(200).json({ url: videoId });
  } catch (error) {
    console.error("Error in getYouTubeVideo:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// export const getYouTubeTranscript = async (req, res) => {
//     const { prompt } = req.body;

//     try {
//         const transcript = await YoutubeTranscript.fetchTranscript(prompt);
//         if (!transcript || transcript.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Transcript is disabled or not available for this video.",
//             });
//         }
//         res.status(200).json({ url: transcript });
//     } catch (error) {
//         if (error.message.includes("Transcript is disabled")) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Transcript is disabled on this video.",
//             });
//         }
//         console.error("Error in getYouTubeTranscript:", error);
//         res.status(500).json({ success: false, message: "Error generating transcript" });
//     }
// };

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
      model = genAIuser.getGenerativeModel({
        model: "gemini-1.5-pro",
        safetySettings,
      });
    } else {
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        safetySettings,
      }); // Default server model
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

const fetchWithRetries = async (prompt, retries = 3, delay = 1000) => {
  while (retries > 0) {
    try {
      return await YoutubeTranscript.fetchTranscript(prompt);
    } catch (error) {
      console.warn(`Retrying... (${3 - retries + 1})`);
      if (retries === 1) throw error; // Rethrow on last attempt
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    retries--;
  }
};

export const getYouTubeTranscript = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid request." });
  }

  try {
    const transcript = await fetchWithRetries(prompt);
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transcript is not available.",
      });
    }
    res.status(200).json({ url: transcript });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching transcript." });
  }
};

// Check API quota availability without consuming tokens
export const checkApiQuota = async (req, res) => {
  try {
    // Get a key to test with
    const keyToTest = getAvailableKey();

    if (!keyToTest) {
      return res.status(429).json({
        success: false,
        available: false,
        message: "No API keys available",
      });
    }

    // Create a small test request that consumes minimal tokens
    const genAITest = new GoogleGenerativeAI(keyToTest);
    const model = genAITest.getGenerativeModel({
      model: "gemini-1.5-flash", // Use flash model for quicker/cheaper check
      safetySettings,
    });

    // Use a tiny prompt
    await model.generateContent("hello");

    return res.status(200).json({
      success: true,
      available: true,
      message: "API quota available",
    });
  } catch (error) {
    console.error("API quota check failed:", error);
    // Handle specific error types
    return res.status(429).json({
      success: false,
      available: false,
      message: "API quota exceeded or other error",
      error: error.message,
    });
  }
};

// Search YouTube videos for learning resources
export const searchYouTubeVideos = async (req, res) => {
  const { query, maxResults = 3 } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query parameter is required",
    });
  }

  try {
    console.log(`Searching YouTube for: ${query}`);
    const results = await youtubesearchapi.GetListByKeyword(
      query,
      false,
      maxResults,
      [{ type: "video" }]
    );

    if (!results || !results.items || results.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No videos found",
      });
    }

    // Extract video links from results
    const videoLinks = results.items.map((video) => {
      return `https://www.youtube.com/watch?v=${video.id}`;
    });

    res.status(200).json({
      success: true,
      videoLinks,
    });
  } catch (error) {
    console.error("Error searching YouTube videos:", error);
    res.status(500).json({
      success: false,
      message: "Error searching YouTube videos",
      error: error.message,
    });
  }
};
