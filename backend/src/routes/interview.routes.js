import express from "express";
import { authenticate } from "../middleware/auth.middleware.js"
import { createInterview, getInterviewQuestions, submitAnswer, getInterviewReport, getInterviewHistory, deleteInterview } from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/create", authenticate, createInterview);
router.get(
    "/:interviewId/questions",
    authenticate,
    getInterviewQuestions
);
router.post(
    "/:interviewId/answer",
    authenticate,
    submitAnswer
);
router.get(
    "/:interviewId/report",
    authenticate,
    getInterviewReport
);
router.get("/", authenticate, getInterviewHistory);
router.delete("/:interviewId", authenticate, deleteInterview);

export default router;