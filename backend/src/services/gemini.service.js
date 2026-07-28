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

    return response.text;
};