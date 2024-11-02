import { Router } from "express";
import Course from "../models/courseModel.js";
import { unsplash } from "../config/clients.js";

const courseRouter = Router();

//STORE COURSE
courseRouter.post("/course", async (req, res) => {
  const { user, content, type, mainTopic } = req.body;

  try {
    const result = await unsplash.search.getPhotos({
      query: mainTopic,
      page: 1,
      perPage: 1,
      orientation: "landscape",
    });
    const photos = result.response?.results;
    const photo = photos[0]?.urls?.regular;
    const newCourse = new Course({ user, content, type, mainTopic, photo });
    await newCourse.save();
    res.json({
      success: true,
      message: "Course created successfully",
      courseId: newCourse._id,
    });
  } catch (error) {
    console.log(error);
  }
});

//UPDATE COURSE
courseRouter.post("/update", async (req, res) => {
  const { content, courseId } = req.body;
  try {
    await Course.findOneAndUpdate({ _id: courseId }, [
      { $set: { content: content } },
    ])
      .then((result) => {
        res.json({ success: true, message: "Course updated successfully" });
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

export default courseRouter;
