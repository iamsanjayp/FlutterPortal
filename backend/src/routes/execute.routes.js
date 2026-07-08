import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
	executeTest,
	executeCustom,
	executeUiPreview,
	executeUiSubmit,
	getExecutionStatus,
	cancelExecutionStatus,
	listExecutionStatuses,
} from "../controllers/execute.controller.js";

const router = express.Router();

router.post("/flutter", authenticate, executeTest);
router.post("/flutter/custom", authenticate, executeCustom);
router.post("/flutter/ui-preview", authenticate, executeUiPreview);
router.post("/flutter/ui-submit", authenticate, executeUiSubmit);
router.get("/flutter/runs", authenticate, listExecutionStatuses);
router.get("/flutter/runs/:runId", authenticate, getExecutionStatus);
router.post("/flutter/runs/:runId/cancel", authenticate, cancelExecutionStatus);

export default router;
