import { GoogleGenAI } from "@google/genai"
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

export const generateInterviewReport = async (interviewData) => {

    const prompt = `
    You are a senior software engineering interviewer.
    You are given an interview with evaluated answers.
    Return ONLY valid JSON.
    Interview Data:
    ${JSON.stringify(interviewData, null, 2)}
    Return this exact JSON schema:
    {
    "overallScore": 0,
    "technicalScore": 0,
    "communicationScore": 0,
    "confidenceScore": 0,
    "problemSolvingScore": 0,
    "strengths": [],
    "weaknesses": [],
    "improvementPlan": [],
    "overallFeedback": ""
    }

    Rules:

    - Scores must be between 0 and 100.
    - strengths should contain 3-6 strings.
    - weaknesses should contain 3-6 strings.
    - improvementPlan should contain actionable bullet points.
    - overallFeedback should be a concise paragraph.
    - Return ONLY JSON. No markdown. No explanations.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
    });
    const text = response.candidates[0].content.parts[0].text;
    const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    let report;

    try {
        report = JSON.parse(cleanText);

        if (
            typeof report.overallScore !== "number" ||
            typeof report.technicalScore !== "number" ||
            typeof report.communicationScore !== "number" ||
            typeof report.confidenceScore !== "number" ||
            typeof report.problemSolvingScore !== "number" ||
            !Array.isArray(report.strengths) ||
            !Array.isArray(report.weaknesses) ||
            !Array.isArray(report.improvementPlan) ||
            typeof report.overallFeedback !== "string"
        ) {
            throw new Error("Invalid report format");
        }
    } catch {
        throw new Error("Failed to parse report.");
    }

    return report;
}