import dotenv from "dotenv";
dotenv.config();
import { createApi } from "unsplash-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const unsplash = createApi({ accessKey: process.env.UNSPLASH_ACCESS_KEY });

export { genAI, unsplash };
