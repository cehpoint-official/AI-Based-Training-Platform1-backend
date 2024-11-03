import { Router } from "express";
import emailRouter from "../routes/emailRoute.js";
import promptRouter from "../routes/promptsRoute.js";
import courseRouter from "../routes/courseRoute.js";
import userRouter from "../routes/userRoute.js";
import gis from "g-i-s";
import youtubesearchapi from "youtube-search-api";
import { YoutubeTranscript } from "youtube-transcript";

const mainRouter = Router();

//GET IMAGE
mainRouter.post("/image", async (req, res) => {
  const receivedData = req.body;
  const promptString = receivedData.prompt;
  try {
    gis(promptString, logResults);
    function logResults(error, results) {
      if (error) {
        //ERROR
        console.log(error);
        gis("Broken Image", logResults);
      } else {
        res.status(200).json({ url: results[0].url });
      }
    }
  } catch (e) {
    console.log(e);
  }
});

//GET VIDEO
mainRouter.post("/yt", async (req, res) => {
  try {
    const { prompt } = req.body;

    const video = await youtubesearchapi.GetListByKeyword(
      prompt,
      [false],
      [1],
      [{ type: "video" }]
    );
    const videoId = await video.items[0].id;
    res.status(200).json({ url: videoId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

//GET TRANSCRIPT
mainRouter.post("/transcript", async (req, res) => {
  try {
    const { prompt } = req.body;

    const transcript = await YoutubeTranscript.fetchTranscript(prompt);

    // Check if transcript is empty
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

mainRouter.post("/project-suggestions", async (req, res) => {
  const { prompt } = req.body;

  try {
    // Replace with your AI generation logic or call to another service
    const response = await someAIService.generateProjectSuggestions(prompt);
    res.json({ suggestions: response.data });
  } catch (error) {
    console.error("Error generating project suggestions:", error);
    res.status(500).send("Error generating project suggestions");
  }
});

mainRouter.use("/course", courseRouter);
mainRouter.use("/mail", emailRouter);
mainRouter.use("/gemini", promptRouter);
mainRouter.use("/user", userRouter);

export default mainRouter;
