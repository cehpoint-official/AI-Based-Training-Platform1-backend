const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);


exports.generateAdditionalQuestionsAI = async (skills, limit) => {
    console.log(`Generating ${limit} AI questions for skills:`, skills);
    
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        safetySettings,
      });
      
      const prompt = `Generate ${limit} challenging technical interview questions for the following skills: ${skills.join(', ')}. Format each question as a numbered list.`;
      console.log("Using prompt:", prompt);
  
      const result = await model.generateContent(prompt);
      console.log("Raw AI response:", result.response);
      
      const rawText = result.response.text();
      console.log("Extracted text:", rawText);
  
      const questionsArray = rawText
        .split(/\n\d+\.\s+/)
        .filter(q => q.trim() !== '')
        .slice(1)
        .map((q, index) => ({
          id: `generated_${index + 1}`,
          question: q.trim(),
          userAnswer: '',
          userTextAnswer: '',
          type: 'text',
          skills: skills,
          isCorrect: null,
        }));
  
      console.log("Processed AI questions:", questionsArray);
      return questionsArray;
    } catch (error) {
      console.error("Error in AI question generation:", error);
      throw error;
    }
  };