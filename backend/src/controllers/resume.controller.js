import prisma from "../config/prisma.js"
import fs from "fs/promises";
import { PDFParse } from 'pdf-parse';

export const uploadResume = async (req, res) => {
    try {
        console.log(req.file);
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

        console.log(result)
        const resume = await prisma.resume.create({
            data: {
                userId,
                title: req.file.originalname,
                fileName,
                resumeUrl: filePath,
                resumeText: cleanedText,
            }
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