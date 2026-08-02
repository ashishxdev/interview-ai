import prisma from "../config/prisma.js"
import fs from "fs/promises";
import { PDFParse } from 'pdf-parse';
import { parseResumeWithGemini } from "../services/gemini.service.js"

const parseJsonFromGemini = (response) => {
    const jsonString = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return JSON.parse(jsonString);
};

const parseResumeLocally = (resumeText) => {
    const lines = resumeText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return {
        parsingStatus: "BASIC",
        personalInfo: {
            name: lines[0] || "",
            email: resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "",
            phone: resumeText.match(/(?:\+?\d[\s-]?){8,15}/)?.[0]?.trim() || "",
            linkedin: resumeText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s]+/i)?.[0] || "",
            github: resumeText.match(/https?:\/\/(?:www\.)?github\.com\/[^\s]+/i)?.[0] || "",
            portfolio: "",
            location: "",
        },
        summary: "",
        skills: {
            languages: [],
            frontend: [],
            backend: [],
            databases: [],
            tools: [],
            other: [],
        },
        experience: [],
        projects: [],
        education: [],
        certifications: [],
    };
};

const enrichResumeInBackground = async ({ resumeId, resumeText }) => {
    try {
        const geminiResponse = await parseResumeWithGemini(resumeText);

        if (!geminiResponse) {
            throw new Error("Empty response from Gemini");
        }

        const parsedData = parseJsonFromGemini(geminiResponse);

        await prisma.resume.update({
            where: {
                id: resumeId,
            },
            data: {
                parsedData: {
                    ...parsedData,
                    parsingStatus: "READY",
                },
            },
        });
    } catch (error) {
        console.error(`Resume ${resumeId} background parsing failed:`, error);
    }
};

export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required.",
            });
        }

        const fileName = req.file.filename;
        const filePath = req.file.path;
        const dataBuffer = await fs.readFile(filePath);
        const parsedPdf = new PDFParse({ data: dataBuffer });
        const result = await parsedPdf.getText();
        await parsedPdf.destroy();
        const userId = req.user.id;

        const cleanedText = result.text
            .replace(/\r/g, "")
            .replace(/\n{2,}/g, "\n")
            .trim();

        const resume = await prisma.resume.create({
            data: {
                userId,
                title: req.file.originalname,
                fileName,
                resumeUrl: filePath,
                resumeText: cleanedText,
                parsedData: parseResumeLocally(cleanedText),
            },
        })

        enrichResumeInBackground({
            resumeId: resume.id,
            resumeText: cleanedText,
        });

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

export const getResumes = async (req, res) => {
    try {
        const resumes = await prisma.resume.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            resumes,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteResume = async (req, res) => {
    try {
        const resumeId = Number(req.params.id);

        if (!Number.isInteger(resumeId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume id.",
            });
        }

        const resume = await prisma.resume.findFirst({
            where: {
                id: resumeId,
                userId: req.user.id,
            },
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        await prisma.resume.delete({
            where: {
                id: resume.id,
            },
        });

        if (resume.resumeUrl) {
            await fs.unlink(resume.resumeUrl).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
