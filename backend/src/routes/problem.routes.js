import express from "express";
import { getProblemById } from "../controllers/problem.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:id", authenticate, getProblemById);

export default router;
