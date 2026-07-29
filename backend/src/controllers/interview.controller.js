import prisma from "../config/prisma.js";
import { evaluateAnswerWithGemini } from "../services/gemini.service.js";

export const getInterviewQuestions = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const userId = req.user.id;
        const interviewIdNumber = Number(interviewId);
        if (isNaN(interviewIdNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID.",
            });
        }

        const interview = await prisma.interview.findUnique({
            where: {
                id: interviewIdNumber,
            },
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found.",
            });
        }

        if (interview.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access.",
            });
        }

        const questions = await prisma.question.findMany({
            where: {
                interviewId: interviewIdNumber,
            },
            orderBy: {
                questionNumber: "asc",
            },
        });

        return res.status(200).json({
            success: true,
            questions,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

export const createInterview = async (req, res) => {

};

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { questionId, answer } = req.body;

        if (!questionId || !answer?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question ID and answer are required.",
            });
        }
        const userId = req.user.id;

        const interviewIdNumber = Number(interviewId);

        if (isNaN(interviewIdNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview ID.",
            });
        }

        const interview = await prisma.interview.findUnique({
            where: {
                id: interviewIdNumber,
            },
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found.",
            });
        }

        if (interview.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access.",
            });
        }

        const question = await prisma.question.findFirst({
            where: {
                id: Number(questionId),
                interviewId: interviewIdNumber,
            },
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found for this interview.",
            });
        }

        const existingAnswer = await prisma.answer.findFirst({
            where: {
                questionId: question.id,
            },
        });

        if (existingAnswer) {
            return res.status(400).json({
                success: false,
                message: "Question already answered.",
            });
        }

        const evaluationText = await evaluateAnswerWithGemini(
            question.question,
            answer
        );
        let evaluation;

        try {
            evaluation = JSON.parse(evaluationText);
        } catch {
            return res.status(500).json({
                success: false,
                message: "Failed to parse Gemini response.",
            });
        }

        const savedAnswer = await prisma.answer.create({
            data: {
                questionId: question.id,
                answer,
                score: evaluation.score,
                feedback: evaluation.feedback,
                idealAnswer: evaluation.idealAnswer,
                missingPoints: evaluation.missingPoints,
                answeredAt: new Date(),
            },
        });

        const totalQuestions = await prisma.question.count({
            where: {
                interviewId: interviewIdNumber,
            },
        });

        const answeredQuestions = await prisma.answer.count({
            where: {
                question: {
                    interviewId: interviewIdNumber,
                },
            },
        });

        if (answeredQuestions === totalQuestions) {
            const answers = await prisma.answer.findMany({
                where: {
                    question: {
                        interviewId: interviewIdNumber,
                    },
                },
            });
            const totalScore = answers.reduce((sum, answer) => {
                return sum + answer.score;
            }, 0);
            const averageScore =
                totalQuestions > 0
                    ? Number((totalScore / totalQuestions).toFixed(2))
                    : 0;
            await prisma.interview.update({
                where: {
                    id: interviewIdNumber,
                },
                data: {
                    overallScore: averageScore,
                    status: InterviewStatus.COMPLETED,
                    endedAt: new Date(),
                },
            });
        }
        return res.status(201).json({
            success: true,
            message: "Answer submitted successfully.",
            answer: savedAnswer,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};