import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/", listTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
