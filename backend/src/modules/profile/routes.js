import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  addXp,
  saveChatSession,
  deleteChatSession,
  pushFlashcardDeck,
  updateFlashcardDeckProgress,
} from "./controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/add-xp", addXp);
router.post("/chat-session", saveChatSession);
router.delete("/chat-session/:id", deleteChatSession);
router.post("/flashcard-deck", pushFlashcardDeck);
router.patch("/flashcard-deck/:id", updateFlashcardDeckProgress);

export default router;
