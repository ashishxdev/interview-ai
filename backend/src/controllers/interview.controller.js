import prisma from "../config/prisma.js";
import { generateInterviewQuestions } from "../services/interview.service.js";

export const createInterview = async (req, res) => {
    try {
        const { resumeId } = req.body;
        const userId = req.user.id;

        if (!resumeId) {
            return res.status(400).json({
                success: false,
                message: "Resume ID is required.",
            });
        }

        const resume = await prisma.resume.findUnique({
            where: {
                id: resumeId,
            },
        });
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found.",
            });
        }

        if (resume.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access.",
            });
        }

        const interview = await prisma.interview.create({
            data: {
                userId,
                resumeId,
                status: "PENDING",
            },
        });

        const generatedQuestions = await generateInterviewQuestions(
            resume.parsedData
        );

        await prisma.question.createMany({
            data: generatedQuestions.questions.map((q) => ({
                interviewId: interview.id,
                question: q.question,
                topic: q.topic,
                questionNumber: q.questionNumber,
            })),
        });

        return res.status(201).json({
            success: true,
            interviewId: interview.id,
            totalQuestions: generatedQuestions.questions.length,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}