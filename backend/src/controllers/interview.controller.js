import prisma from "../config/prisma.js";
import { evaluateAnswerWithGemini, generateInterviewQuestions } from "../services/gemini.service.js";
import { InterviewStatus } from "../generated/prisma/index.js";
import { generateInterviewReport } from "../services/report.service.js"

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
    try {
        const { resumeId, difficulty, title } = req.body;
        const userId = req.user.id;

        const resumeIdNumber = Number(resumeId);

        if (isNaN(resumeIdNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resume ID.",
            });
        }
        const resume = await prisma.resume.findUnique({
            where: {
                id: resumeIdNumber,
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
        if (!resume.parsedData) {
            return res.status(400).json({
                success: false,
                message: "Resume has not been parsed yet.",
            });
        }
        const questions = await generateInterviewQuestions(
            resume.parsedData,
            difficulty
        );
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Failed to generate interview questions.");
        }
        const interview = await prisma.interview.create({
            data: {
                userId,
                resumeId: resume.id,
                title,
                difficulty,
                resumeSnapshot: resume.parsedData,
            },
        });

        await prisma.question.createMany({
            data: questions.map((question, index) => ({
                interviewId: interview.id,
                questionNumber: index + 1,
                question: question.question,
                topic: question.topic,
            })),
        });
        return res.status(201).json({
            success: true,
            interviewId: interview.id,
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { questionId, answer } = req.body;

        if (!questionId || typeof answer !== "string" || !answer.trim()) {
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
        const questionIdNumber = Number(questionId);

        if (isNaN(questionIdNumber)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID.",
            });
        }
        const question = await prisma.question.findFirst({
            where: {
                id: questionIdNumber,
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
            if (
                typeof evaluation.score !== "number" ||
                !evaluation.feedback ||
                !evaluation.idealAnswer
            ) {
                throw new Error("Invalid evaluation response.");
            }
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
            await prisma.interview.update({
                where: {
                    id: interviewIdNumber,
                },
                data: {
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

export const getInterviewReport = async (req, res) => {
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
            include: {
                report: true,
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

        if (interview.status !== InterviewStatus.COMPLETED) {
            return res.status(400).json({
                success: false,
                message: "Interview is not completed yet.",
            });
        }

        if (interview.report) {
            return res.status(200).json({
                success: true,
                report: interview.report,
            });
        }

        const questions = await prisma.question.findMany({
            where: {
                interviewId: interviewIdNumber,
            },
            include: {
                answer: true,
            },
            orderBy: {
                questionNumber: "asc",
            },
        });

        if (questions.some((question) => !question.answer)) {
            return res.status(400).json({
                success: false,
                message: "Some interview answers are missing.",
            });
        }

        const interviewData = questions.map((question) => ({
            question: question.question,
            topic: question.topic,
            candidateAnswer: question.answer?.answer,
            score: question.answer?.score,
            feedback: question.answer?.feedback,
            idealAnswer: question.answer?.idealAnswer,
            missingPoints: question.answer?.missingPoints,
        }));

        const reportData = await generateInterviewReport(interviewData);
        const report = await prisma.report.create({
            data: {
                userId,
                interviewId: interviewIdNumber,
                duration: interview.endedAt && interview.createdAt
                    ? Math.floor(
                        (new Date(interview.endedAt) - new Date(interview.createdAt)) / 1000
                    )
                    : null,
                overallScore: reportData.overallScore,
                technicalScore: reportData.technicalScore,
                communicationScore: reportData.communicationScore,
                confidenceScore: reportData.confidenceScore,
                problemSolvingScore: reportData.problemSolvingScore,
                strengths: reportData.strengths,
                weaknesses: reportData.weaknesses,
                improvementPlan: reportData.improvementPlan,
                overallFeedback: reportData.overallFeedback,
            },
        });

        return res.status(200).json({
            success: true,
            report,
        })

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const getInterviewHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const interviews = await prisma.interview.findMany({
            where: {
                userId,
            },
            include: {
                report: {
                    select: {
                        overallScore: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const formattedInterviews = interviews.map((interview) => ({
            id: interview.id,
            title: interview.title,
            difficulty: interview.difficulty,
            status: interview.status,
            createdAt: interview.createdAt,
            overallScore: interview.report?.overallScore ?? null,
        }));

        return res.status(200).json({
            success: true,
            interviews: formattedInterviews,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const deleteInterview = async (req, res) => {
    try {
        const userId = req.user.id;
        const interviewId = Number(req.params.interviewId);

        if (isNaN(interviewId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview id.",
            });
        }

        const interview = await prisma.interview.findFirst({
            where: {
                id: interviewId,
                userId,
            },
        });

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found.",
            });
        }

        // thru transaction
        // await prisma.$transaction(async (tx) => {
        //     await tx.answer.deleteMany({
        //         where: {
        //             question: {
        //                 interviewId,
        //             },
        //         },
        //     });
        //     await tx.question.deleteMany({
        //         where: {
        //             interviewId,
        //         },
        //     });
        //     await tx.report.deleteMany({
        //         where: {
        //             interviewId,
        //         },
        //     });
        //     await tx.interview.delete({
        //         where: {
        //             id: interviewId,
        //         },
        //     });
        // });

        // thru cascade delete after fixing db
        await prisma.interview.delete({
            where: {
                id: interviewId,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Interview deleted successfully.",
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};