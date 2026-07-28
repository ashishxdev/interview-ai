import express from "express";
import { authenticate } from "../middleware/auth.middleware.js"
import { createInterview } from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/create", authenticate, createInterview);

export default router;