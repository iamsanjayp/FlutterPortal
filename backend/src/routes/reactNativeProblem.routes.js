import express from "express";
import { getProblemById } from "../controllers/problem.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get React Native problem by ID (for students during test)
router.get("/:id", authenticate, getProblemById);

export default router;
