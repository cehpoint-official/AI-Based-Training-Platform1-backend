import Quiz from '../models/Quiz.js'; 

export const createQuizResult = async (req, res) => {
    const { userId, courseId, score } = req.body;

    // Validate input data
    if (!userId || !courseId || score === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Create a new Quiz document
        const newQuizResult = new Quiz({
            userId,
            courseId,
            score,
        });

        // Save the document to the database
        await newQuizResult.save();

        // Return the created quiz result
        res.status(201).json(newQuizResult);
    } catch (error) {
        console.error('Error saving quiz result:', error);
        res.status(500).json({ error: 'Failed to save quiz result' });
    }
};

export const getQuizResults = async (req, res) => {
    try {
        const results = await Quiz.find();
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.status(500).json({ error: 'Failed to fetch quiz results' });
    }
};

export const getUserQuizResults = async (req, res) => {
    const { userId } = req.params;

    try {
        const results = await Quiz.find({ userId });
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching user quiz results:', error);
        res.status(500).json({ error: 'Failed to fetch user quiz results' });
    }
};
