//IMPORT
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import functions from "firebase-functions";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

dotenv.config();
import mainRouter from "./routes/indexRoute.js";

connectDB();

//INITIALIZ
const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-based-training-platfo-ca895.web.app",
  "https://ai-based-training-by-ariba-2d081.web.app",
  "https://ai-skill-enhancement-and-job-readiness.cehpoint.co.in",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));
const PORT = process.env.PORT || 5000;
app.use(bodyParser.json());

//const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", mainRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const cehpoint_api = functions.https.onRequest(app);

export { cehpoint_api };
