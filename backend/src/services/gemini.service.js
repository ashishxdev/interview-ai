import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

export const parseResumeWithGemini = async (resumeText) => {

    const prompt = `
    You are an expert ATS Resume Parser.

    Extract information from the following resume.

    Return ONLY valid JSON.

    Do not wrap the JSON inside markdown.
    Do not write any explanation.
    Do not write \`\`\`json.
    Return only the JSON object.

    JSON Structure:

    {
    "personalInfo": {
        "name": "",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "portfolio": "",
        "location": ""
    },

    "summary": "",

    "skills": {
        "languages": [],
        "frontend": [],
        "backend": [],
        "databases": [],
        "tools": [],
        "other": []
    },

    "experience": [
        {
        "company": "",
        "role": "",
        "startDate": "",
        "endDate": "",
        "location": "",
        "description": []
        }
    ],

    "projects": [
        {
        "name": "",
        "techStack": [],
        "description": []
        }
    ],

    "education": [
        {
        "college": "",
        "degree": "",
        "branch": "",
        "startDate": "",
        "endDate": ""
        }
    ],

    "certifications": []
    }

    Resume:

    ${resumeText}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    const cleanedText = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return cleanedText;
};

export const evaluateAnswerWithGemini = async (question, answer) => {

    const prompt = `
    You are an expert technical interviewer.

    Evaluate the candidate's answer.

    Question:
    ${question}

    Candidate Answer:
    ${answer}

    Return ONLY valid JSON.

    Do not wrap inside markdown.
    Do not write \`\`\`json.
    Do not write explanations.

    JSON Structure:

    {
        "score": 8,
        "feedback": "Good explanation...",
        "idealAnswer": "...",
        "missingPoints": [
            "...",
            "..."
        ]
    }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    const cleanedText = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return cleanedText;
};

export const generateInterviewQuestions = async (
    parsedResume,
    difficulty
) => {
    const prompt = `
You are an expert technical interviewer.

Based on the candidate's resume, 
Generate EXACTLY 10 questions.
Do not generate fewer than 10.
Do not generate more than 10.
Avoid asking duplicate or highly similar questions.
Cover different technologies, concepts, and projects from the resume.

Base every technical and project question on technologies, projects, or experience mentioned in the resume. Do not ask about technologies that are not present unless they are fundamental computer science concepts.

Difficulty: ${difficulty || "MEDIUM"}

Question distribution:

- 6 Technical questions
- 2 Project-based questions
- 2 behavioral questions related to teamwork, communication, problem-solving, or past experiences.

Resume:

${JSON.stringify(parsedResume)}

Return ONLY valid JSON.

Do not wrap inside markdown.
Do not write \`\`\`json.
Do not write explanations.

JSON Structure:

[
    {
        "question":"Explain React Virtual DOM.",
        "topic":"React",
        "type":"TECHNICAL"
    },
    {
        "question":"Tell me about your expense tracker project.",
        "topic":"Projects",
        "type":"PROJECT"
    },
    {
        "question":"Tell me about yourself.",
        "topic":"HR",
        "type":"HR"
    }
]
`;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });

    const cleanedText = response.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    let questions;

    try {
        questions = JSON.parse(cleanedText);
    } catch {
        throw new Error("Failed to parse interview questions from Gemini.");
    }


    if (
        !Array.isArray(questions) ||
        !questions.every(
            (q) =>
                typeof q.question === "string" &&
                typeof q.topic === "string" &&
                typeof q.type === "string"
        )
    ) {
        throw new Error("Invalid interview questions generated.");
    }

    return questions;
};