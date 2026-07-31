import express from "express";
import { authenticate } from "../middleware/auth.middleware.js"
import { getDashboardStats } from "../controllers/dashboard.controller.js"
const router = express.Router();

router.get("/", authenticate, getDashboardStats)

export default router;