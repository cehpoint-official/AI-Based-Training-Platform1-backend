const ProjectTemplate = require('../models/ProjectTemplate');

exports.getMainProjects = async (req, res) => {
    try {
        const projects = await ProjectTemplate.find();
    
        if (!projects || projects.length === 0) {
          return res.status(404).json({ success: false, message: "No projects found" });
        }
    
        res.json({ success: true, data: projects, message: "Main projects fetched successfully" });
      } catch (error) {
        console.error("Error fetching main projects:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
};

exports.saveProject = async (req, res) => {
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

exports.updateProject = async (req, res) => {
    try {
        const { projectTitle, userId, title } = req.body;
        console.log("Received data:", req.body);

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