import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import ProjectTemplate from '../models/ProjectTemplate.js';
import dotenv from 'dotenv';

dotenv.config();

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

export const getMainProjects = async (req, res) => {
    try {
        const { mainTopic, useUserApiKey, userApiKey } = req.body;

        // Log the mainTopic early for debugging
        console.log("Searching for projects with mainTopic:", mainTopic);

        let existingProjects = await ProjectTemplate.find();
        const projectsToEvaluate = existingProjects.slice(0, 15);

        // Initialize models with appropriate variants
        let evaluationModel, generationModel;
        if (useUserApiKey && userApiKey) {
            const genAIuser = new GoogleGenerativeAI(userApiKey);
            evaluationModel = genAIuser.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
            generationModel = genAIuser.getGenerativeModel({ model: "gemini-1.5-pro", safetySettings });
        } else {
            evaluationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
            generationModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", safetySettings });
        }

        // Improved evaluation prompt that is more generic and doesn't hardcode React/MERN
        const evaluationPrompt = `
I have a set of project ideas and a topic of interest: "${mainTopic}".
This is EXTREMELY IMPORTANT: Only give high scores to projects that match the technologies or domain specified in the topic.

Evaluation rules:
1. ONLY give scores of 7+ to projects that specifically use technologies mentioned in the topic
2. Score 0-3 for ANY project that uses technologies not directly related to the topic
3. Do not give high scores to projects from unrelated domains (e.g., if topic is web development, projects about ML, DevOps, Data Engineering should get scores of 0-3 UNLESS the topic specifically mentions these domains)

Score explanation:
- Score 7-10: Project is DIRECTLY related to the EXACT technologies/domain in the topic
- Score 4-6: Project has some relation but doesn't fully match the specific technologies/domain
- Score 0-3: Project uses different technologies or is from a different domain

Here are the projects to evaluate:
${projectsToEvaluate.map((project, index) =>
            `Project ${index + 1}:
  Title: ${project.title}
  Category: ${project.category}
  Description: ${project.description}
  Difficulty: ${project.difficulty}`
        ).join('\n\n')}

For each project, respond with just the project number followed by the score (0-10). Format your response as valid JSON like this:
{
  "evaluations": [
    {"projectIndex": 0, "score": 8},
    {"projectIndex": 1, "score": 3},
    ...
  ]
}`;

        // Use gemini-1.5-flash for evaluation
        const evaluationResult = await evaluationModel.generateContent(evaluationPrompt);
        const evaluationResponse = evaluationResult.response.text();

        // Log the evaluation response for debugging
        console.log("AI Evaluation Response:", evaluationResponse);

        let evaluations;
        try {
            // Try to parse the JSON response
            const match = evaluationResponse.match(/\{[\s\S]*\}/);
            if (match) {
                evaluations = JSON.parse(match[0]).evaluations;
            } else {
                throw new Error("Failed to extract JSON from evaluation response");
            }
        } catch (evalError) {
            console.error("Error parsing evaluation response:", evalError);
            console.log("Raw evaluation response:", evaluationResponse);
            // Fall back to generating new projects if evaluation fails
            evaluations = [];
        }

        // Filter projects based on AI evaluation scores (score >= 7 is considered relevant)
        if (evaluations && evaluations.length > 0) {
            // Log all evaluations for debugging
            console.log("All project evaluations:", evaluations);

            const relevantProjects = evaluations
                .filter(evaluation => evaluation.score >= 7)
                .map(evaluation => projectsToEvaluate[evaluation.projectIndex]);

            // Log relevant projects for debugging
            console.log("Found relevant projects:", relevantProjects.map(p => p.title));

            // If we have enough relevant projects, return them
            if (relevantProjects.length >= 3) {
                return res.json({
                    success: true,
                    data: relevantProjects,
                    message: "Relevant projects fetched and evaluated successfully",
                    source: "database"
                });
            } else {
                console.log("Not enough relevant projects found, generating new ones");
            }
        }

        // If no relevant projects found or evaluation failed, generate with Gemini Pro API
        // Updated prompt that's more generic and not specific to React/MERN
        const enhancedPrompt = `Generate 5 industry-relevant hands-on assessment projects based on the main topic: "${mainTopic}"

CRITICAL INSTRUCTIONS:
- Projects MUST ONLY use technologies EXPLICITLY mentioned in the topic - this is the highest priority rule
- ANY project that uses technologies not mentioned in the topic is STRICTLY FORBIDDEN
- NEVER suggest projects from domains not directly related to the topic
- Match the difficulty level appropriately to the technologies mentioned

PROJECT REQUIREMENTS:
- Each project should help learners apply their knowledge in a real-world scenario
- Must be practical and achievable within a short timeframe (3-7 days)
- Should be directly useful in a corporate or professional setting
- Focus on demonstrating specific skills that would be valuable on a resume
- Include clear learning objectives that the project helps assess
- Be designed as an assessment that tests applied knowledge
- Projects should represent actual tasks professionals would perform in the industry

For each project, provide the following in JSON format:
{
  "title": "[Specific, professional-sounding project title using only technologies mentioned in the topic]",
  "category": "[Specific category directly related to the requested technology]",
  "description": "[Detailed description including purpose, technologies, implementation approach, and business value]",
  "learningObjectives": "[3-5 specific skills or concepts the project helps assess]",
  "difficulty": "[One of: Beginner, Intermediate, Advanced]",
  "timeEstimate": "[Estimated completion time in days (between 3-7)]",
  "deliverables": "[List of specific outputs the learner should produce]",
  "realWorldApplication": "[How this project relates to actual industry tasks]",
  "assignedTo": []
}

Format the entire response as a valid JSON array of these objects.`;

        // Use gemini-1.5-pro for project generation
        const result = await generationModel.generateContent(enhancedPrompt);
        const response = result.response.text();

        // Parse the response to get projects
        let generatedProjects;
        try {
            generatedProjects = JSON.parse(response);
        } catch (parseError) {
            console.error("Error parsing Gemini response:", parseError);
            // Attempt to extract JSON from the response if it contains text around the JSON
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                try {
                    generatedProjects = JSON.parse(jsonMatch[0]);
                } catch (secondParseError) {
                    throw new Error("Failed to parse project data from Gemini response");
                }
            } else {
                throw new Error("Failed to extract valid JSON from Gemini response");
            }
        }

        if (!generatedProjects || generatedProjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No projects could be generated"
            });
        }

        // Save the generated projects to the database for future use
        try {
            for (const project of generatedProjects) {
                // Check if a project with the same title already exists
                const existingProject = await ProjectTemplate.findOne({ title: project.title });
                if (!existingProject) {
                    const newProject = new ProjectTemplate(project);
                    await newProject.save();
                }
            }
        } catch (saveError) {
            console.error("Error saving generated projects to database:", saveError);
            // Continue execution - we'll still return the generated projects even if saving fails
        }

        res.json({
            success: true,
            data: generatedProjects,
            message: "Projects generated successfully using AI",
            source: "generated"
        });
    } catch (error) {
        console.error("Error in getMainProjects:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const saveProject = async (req, res) => {
    try {
        const { title, category, description, difficulty, time } = req.body;

        // Validate required fields
        if (!title || !category || !description || !difficulty || !time) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Create new project template
        const newProject = new ProjectTemplate({
            title,
            category,
            description,
            difficulty,
            time,
            assignedTo: [] // Initialize empty array for assigned users
        });

        await newProject.save();

        res.status(201).json({
            success: true,
            message: "Project saved successfully"
        });
    } catch (error) {
        console.error("Error saving project:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { projectTitle, userId, title } = req.body;
        // console.log("Received data:", req.body);

        // Create the object to be added to the assignedTo array
        const assignedObject = { userid: userId, title: title };

        const updatedProject = await ProjectTemplate.findOneAndUpdate(
            { title: projectTitle },  // Find the project by title
            { $addToSet: { assignedTo: assignedObject } },  // Add the userId and title to assignedTo array if not exists
            { new: true }  // Return the updated document
        );

        if (!updatedProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.json({
            success: true,
            message: "Project updated successfully",
            data: updatedProject
        });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};