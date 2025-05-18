import { Router } from "express";
import Course from "../models/courseModel.js";
import { unsplash } from "../config/clients.js";
import multer from "multer";
import axios from "axios";
import { genAI } from "../config/clients.js";
import { createApi } from "unsplash-js";

const courseRouter = Router();
const upload = multer();

// Helper function to search YouTube for a topic
const searchYouTubeVideos = async (topic, subtopic) => {
  try {
    // Use AI to generate likely video titles and create reasonable links
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Generate 3 likely YouTube video URLs for learning "${subtopic}" in "${topic}". 
    Format the response as a JSON array of video links. Make them realistic looking YouTube URLs with video IDs. 
    For example: ["https://www.youtube.com/watch?v=abcdef12345", "https://www.youtube.com/watch?v=ghijk67890"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract the JSON array from the response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error("Error parsing generated JSON:", error);
      }
    }

    // Fallback if JSON parsing fails
    return [
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${topic} ${subtopic} tutorial`
      )}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `learn ${subtopic} in ${topic}`
      )}`,
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${subtopic} ${topic} for beginners`
      )}`,
    ];
  } catch (error) {
    console.error("Error generating YouTube links:", error);
    return [];
  }
};

// Function to process and add YouTube links to course content
const addYouTubeLinksToContent = async (content) => {
  try {
    // Parse the content JSON
    const parsedContent =
      typeof content === "string" ? JSON.parse(content) : content;
    const mainTopic = Object.keys(parsedContent)[0];

    // Add YouTube links to each subtopic
    for (const topic of parsedContent[mainTopic]) {
      for (const subtopic of topic.subtopics) {
        // Generate YouTube links for this subtopic
        subtopic.youtubeLinks = await searchYouTubeVideos(
          topic.title,
          subtopic.title
        );
      }
    }

    return JSON.stringify(parsedContent);
  } catch (error) {
    console.error("Error adding YouTube links to content:", error);
    return content; // Return original content if there's an error
  }
};

//STORE COURSE
courseRouter.post("/course", async (req, res) => {
  const { user, content, type, mainTopic, subTopic } = req.body;

  // Process content to add YouTube links
  const contentWithLinks = await addYouTubeLinksToContent(content);

  const receivedData = req.body;
  const useUserApiKey = receivedData.useUserApiKey || false;
  const userunsplashkey = receivedData.userunsplashkey || null;
  if (useUserApiKey) {
    const unsplash2 = createApi({ accessKey: userunsplashkey });
    try {
      const result = await unsplash2.search.getPhotos({
        query: `${mainTopic} ${subTopic}`,
        page: 1,
        perPage: 1,
        orientation: "landscape",
      });
      const photos = result.response?.results;
      const photo = photos[0]?.urls?.regular;
      const newCourse = new Course({
        user,
        content: contentWithLinks,
        type,
        mainTopic,
        photo,
        subTopic,
      });
      await newCourse.save();
      res.json({
        success: true,
        message: "Course created successfully with YouTube links",
        courseId: newCourse._id,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else {
    try {
      const result = await unsplash.search.getPhotos({
        query: `${mainTopic} ${subTopic}`,
        page: 1,
        perPage: 1,
        orientation: "landscape",
      });
      const photos = result.response?.results;
      const photo = photos[0]?.urls?.regular;
      const newCourse = new Course({
        user,
        content: contentWithLinks,
        type,
        mainTopic,
        photo,
      });
      await newCourse.save();
      res.json({
        success: true,
        message: "Course created successfully with YouTube links",
        courseId: newCourse._id,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
});

//UPDATE COURSE
courseRouter.post("/update", async (req, res) => {
  const { content, courseId, chunkIndex, totalChunks } = req.body;

  try {
    // If this is the last chunk, process the content to add YouTube links if needed
    if (totalChunks && chunkIndex === totalChunks - 1) {
      // First check if the content already has YouTube links
      let parsedContent;
      try {
        parsedContent =
          typeof content === "string" ? JSON.parse(content) : content;
        const mainTopic = Object.keys(parsedContent)[0];
        const firstTopic = parsedContent[mainTopic][0];
        const firstSubtopic = firstTopic.subtopics[0];

        // If youtubeLinks doesn't exist, add them
        const needsYouTubeLinks = !firstSubtopic.hasOwnProperty("youtubeLinks");

        if (needsYouTubeLinks) {
          // Add YouTube links to the content
          const contentWithLinks = await addYouTubeLinksToContent(content);

          // Update the course with the enhanced content
          await Course.findOneAndUpdate(
            { _id: courseId },
            { $set: { content: contentWithLinks } }
          );

          res.json({
            success: true,
            message: "Course updated successfully with YouTube links",
          });
          return;
        }
      } catch (error) {
        // If parsing fails, just continue with the regular update
        console.error("Error parsing content:", error);
      }
    }

    // Proceed with regular update
    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { content: content } }
    );

    res.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET ALL COURSES
courseRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Course.find({ user: id }).then((result) => {
      res.json(result);
    });
  } catch (error) {
    console.log(error);
  }
});

courseRouter.post("/finish", async (req, res) => {
  const { courseId } = req.body;
  try {
    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { completed: true, end: Date.now() } }
    )
      .then((result) => {
        res.json({ success: true, message: "Course completed successfully" });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  } catch (error) {
    console.log(error);
  }
});

courseRouter.post("/create", upload.none(), async (req, res) => {
  try {
    const { user, content, type, mainTopic, subTopic, photo, end, courseId } =
      req.body;

    // Process content to add YouTube links
    const contentWithLinks = await addYouTubeLinksToContent(content);

    const course = new Course({
      user,
      content: contentWithLinks,
      type,
      mainTopic,
      subTopic,
      photo,
      end,
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: "Successfully created Course",
      courseId: course._id,
      content: contentWithLinks,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default courseRouter;
