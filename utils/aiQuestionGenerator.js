import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateAdditionalQuestionsAI = async (skills, limit) => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Here are skills: ${skills}.Generate exatly ${limit} hardest technical questions.In the format Ques: *** question generated ***`;

  try {
    const result = await model.generateContent(prompt);
    console.log("Full AI Response:", result); // Log the entire response

    // Ensure result has candidates and access the response text
    const responseText = result.response.text() || '';
    console.log("AI Response Text: ", responseText);

    // Use regex to extract questions based on the expected format
    const questionsArray = responseText
      .split('\n') // Split the response text by new lines
      .filter(line => line.startsWith('**Ques:')) // Filter lines that start with '**Ques:'
      .map((line, index) => {
        // Remove '**Ques: ' prefix and clean up the question
        const question = line.replace(/^\*\*Ques:\s*/, '').trim();

        return {
          id: `generated_${index + 1}`,
          question: question, // Clean question text
          userAnswer: '',
          userTextAnswer: '',
          type: 'text',
          skills: "additional",
          isCorrect: null,
        };
      })
      .slice(0, limit); // Limit the number of questions extracted

    console.log("Extracted questions:", questionsArray);
    return questionsArray;
  } catch (error) {
    console.error("Error generating questions with AI: ", error);
    return []; // Return an empty array on error
  }
};