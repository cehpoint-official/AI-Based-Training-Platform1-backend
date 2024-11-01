const fetch = require('node-fetch');

exports.generateAdditionalQuestionsAI = async (skills, limit) => {
    console.log(`Generating ${limit} AI questions for skills:`, skills);
    
    const url = process.env.CHATGPT_API_URL;

    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_HOST,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "Generate the hardest technical interview questions."
                },
                {
                    role: "user",
                    content: `Here are skills: ${skills.join(', ')}. Generate ${limit} hardest questions, and avoid corporate topics.`
                }
            ],
            model: 'gpt-3.5-turbo',
            max_tokens: 900,
            temperature: 0.9,
        }),
    };

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("AI Response: ", result);

        const rawText = result.choices[0].message.content;

        const unwantedPhrases = [
            "Here are five challenging technical questions based on the skills you mentioned:",
            "Sure! Here are five challenging technical questions based on the listed skills:",
        ];
        
        const questionsArray = rawText
            .split(/\n\d+\.\s+/)
            .filter(q => q.trim() !== '' && !unwantedPhrases.some(phrase => q.includes(phrase)))
            .slice(1, limit + 1)
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