import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import {
  aiProLimiter,
  aiFlashLimiter,
  chat,
  careerAnalysis,
  generateRoadmap,
  generateFlashcards,
  generateResume,
  dailyQuiz,
  studyNotes,
  summarizeDocument,
  careerTools,
} from "./controller.js";

const router = Router();
router.use(authMiddleware);

router.post("/chat", aiProLimiter, chat);
router.post("/career-analysis", aiProLimiter, careerAnalysis);
router.post("/generate-roadmap", aiProLimiter, generateRoadmap);
router.post("/generate-flashcards", aiProLimiter, generateFlashcards);
router.post("/generate-resume", aiProLimiter, generateResume);
router.post("/daily-quiz", aiFlashLimiter, dailyQuiz);
router.post("/study-notes", aiProLimiter, studyNotes);
router.post("/summarize-document", aiProLimiter, summarizeDocument);
router.post("/career-tools", aiProLimiter, careerTools);

export default router;
