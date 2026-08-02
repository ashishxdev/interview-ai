import express from "express"
import { upload } from "../middleware/upload.middleware.js"
import { authenticate } from "../middleware/auth.middleware.js"
import { uploadResume, getResumes, deleteResume } from "../controllers/resume.controller.js"

const router = express.Router();

router.post("/upload", authenticate, upload.single("resume"), uploadResume)
router.get("/", authenticate, getResumes);
router.delete("/:id", authenticate, deleteResume);

export default router;
