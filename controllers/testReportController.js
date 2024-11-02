import TestReport from '../models/TestReport.js';

export const createTestReport = async (req, res) => {
    try {
        const { name, email, uid, reportData } = req.body;

        // Validate required fields
        if (!name || !email || !uid || !reportData) {
            return res.status(400).json({ 
                message: 'Name, email, UID, and report data are required' 
            });
        }

        const testReport = new TestReport({ 
            name, 
            email, 
            uid, 
            reportData 
        });

        const savedReport = await testReport.save();
        res.status(201).json(savedReport);

    } catch (error) {
        console.error('Error saving test report:', error);
        res.status(500).json({ 
            message: 'Failed to save test report', 
            error: error.message 
        });
    }
};

export const getTestReport = async (req, res) => {
    try {
        const testReport = await TestReport.findOne({ uid: req.params.uid });
        
        if (!testReport) {
            return res.status(404).json({ 
                success: false, 
                message: 'No such document!' 
            });
        }

        res.status(200).json({
            success: true,
            data: testReport
        });

    } catch (error) {
        console.error('Error fetching test report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};

export const updateTestReport = async (req, res) => {
    try {
        const { uid } = req.params;
        const { 
            expectations, 
            questions, 
            aiAnalysis, 
            feedback, 
            suggestions 
        } = req.body;

        const updatedReport = await TestReport.findOneAndUpdate(
            { uid: uid },
            {
                $set: {
                    'reportData.expectations': expectations,
                    'reportData.questions': questions,
                    'reportData.aiAnalysis': aiAnalysis,
                    'reportData.feedback': feedback,
                    'reportData.suggestions': suggestions
                }
            },
            { new: true, upsert: false }
        );

        if (!updatedReport) {
            return res.status(404).json({ 
                message: 'Test report not found' 
            });
        }

        res.status(200).json({ 
            message: 'Test report updated successfully', 
            report: updatedReport 
        });

    } catch (error) {
        console.error('Error updating test report:', error);
        res.status(500).json({ 
            message: 'Failed to update test report', 
            error: error.message 
        });
    }
};

export const getAllTestReports = async (req, res) => {
    try {
        const testReports = await TestReport.find({}, 'name email uid createdAt reportData');

        if (!testReports || testReports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No test reports found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Test reports retrieved successfully",
            data: testReports
        });
    } catch (error) {
        console.error("Error fetching test reports:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};