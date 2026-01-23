import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  startTest,
  getTestData,
  finishTest,
  submitFeedback,
} from "../controllers/test.controller.js";

const router = express.Router();

router.post("/start", authenticate, startTest);
router.get("/:sessionId", authenticate, getTestData);
router.post("/finish", authenticate, finishTest);
router.post("/feedback", authenticate, submitFeedback);

export default router;
