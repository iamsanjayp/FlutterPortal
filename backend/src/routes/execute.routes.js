import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
	executeTest,
	executeCustom,
	executeUiPreview,
	executeUiSubmit,
} from "../controllers/execute.controller.js";

const router = express.Router();

router.post("/flutter", authenticate, executeTest);
router.post("/flutter/custom", authenticate, executeCustom);
router.post("/flutter/ui-preview", authenticate, executeUiPreview);
router.post("/flutter/ui-submit", authenticate, executeUiSubmit);

export default router;
