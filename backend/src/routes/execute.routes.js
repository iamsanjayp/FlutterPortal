import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { executeTest, executeCustom } from "../controllers/execute.controller.js";

const router = express.Router();

router.post("/flutter", authenticate, executeTest);
router.post("/flutter/custom", authenticate, executeCustom);

export default router;
