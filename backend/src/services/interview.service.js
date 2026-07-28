import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

export const generateInterviewQuestions = async (parsedData) => {

    const prompt = `
    You are a Senior Software Engineer interviewer.

    Candidate Information:

    ${JSON.stringify(parsedData)}

    Generate exactly 15 interview questions.

    Rules:

    - 2 Introduction
    - 3 Experience
    - 5 Project Deep Dive
    - 3 Technical Skills
    - 2 HR

    Project questions should deeply analyze the candidate's own projects.

    Technical questions should focus on the candidate's listed skills.

    Return ONLY valid JSON.

    Structure:

    {
    "questions":[
        {
        "question":"...",
        "topic":"React",
        "questionNumber":1
        }
    ]
    }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    const json = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const parsedQuestions = JSON.parse(json);
    return parsedQuestions;
};