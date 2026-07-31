import prisma from "../config/prisma.js";

export const getDashboardStats = async (req, res) => {
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

        const totalInterviews = interviews.length;

        const completedInterviews = interviews.filter(
            interview => interview.status === "COMPLETED"
        ).length;

        const inProgressInterviews = interviews.filter(
            interview => interview.status === "IN_PROGRESS"
        ).length;

        const completedWithReports = interviews.filter(
            interview => interview.report?.overallScore != null
        );

        const averageScore =
            completedWithReports.length > 0
                ? Number(
                    (
                        completedWithReports.reduce(
                            (sum, interview) =>
                                sum + interview.report.overallScore,
                            0
                        ) / completedWithReports.length
                    ).toFixed(1)
                )
                : 0;

        const latest = interviews[0];
        const latestInterview = latest
            ? {
                id: latest.id,
                title: latest.title,
                status: latest.status,
                createdAt: latest.createdAt,
                overallScore: latest.report?.overallScore ?? null,
            }
            : null;

        return res.status(200).json({
            success: true,
            stats: {
                totalInterviews,
                completedInterviews,
                inProgressInterviews,
                averageScore,
                latestInterview,
            },
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}