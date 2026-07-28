import prisma from "../config/prisma.js"
import fs from "fs/promises";
import { PDFParse } from 'pdf-parse';
import { parseResumeWithGemini } from "../services/gemini.service.js"

export const uploadResume = async (req, res) => {
    try {
        const fileName = req.file.filename;
        const filePath = req.file.path;
        const dataBuffer = await fs.readFile(filePath);
        const parsedPdf = new PDFParse({ data: dataBuffer });
        const result = await parsedPdf.getText();
        await parsedPdf.destroy();
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required.",
            });
        }

        const cleanedText = result.text
            .replace(/\r/g, "")
            .replace(/\n{2,}/g, "\n")
            .trim();

        const geminiResponse = await parseResumeWithGemini(cleanedText);
        if (!geminiResponse) {
            throw new Error("Empty response from Gemini");
        }
        const jsonString = geminiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        let parsedData;
        try {
            parsedData = JSON.parse(jsonString);
        } catch {
            throw new Error("Gemini returned invalid JSON");
        }

        const resume = await prisma.resume.create({
            data: {
                userId,
                title: req.file.originalname,
                fileName,
                resumeUrl: filePath,
                resumeText: cleanedText,
                parsedData,
            },
        })

        return res.status(201).json({
            success: true,
            resume,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}