import express from "express";
import {
  getOrCreateSession,
  getCurrentProblem,
  clearSession,
  endTest
} from "../controllers/session.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get or create a session with randomly assigned problems
router.get("/", authenticate, getOrCreateSession);

// Get the current problem for the active session
router.get("/current-problem", authenticate, getCurrentProblem);

// End test (student action - deletes their session)
router.post("/end-test", authenticate, endTest);

// Clear session (for testing/admin purposes)
router.post("/clear", authenticate, clearSession);

export default router;
