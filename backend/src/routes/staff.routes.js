import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import {
  getRNSubmissions,
  runRNSubmission,
  updateRNSubmissionStatus,
  gradeSubmission,
  getMyAssignments,
  getSlotStudents,
  revokeSlotStudent,
  extendStudentTime
} from "../controllers/admin.controller.js";
import { getPoolConfig, updatePoolConfig, previewPool } from "../controllers/pool.controller.js";
import { getStudentAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// Staff and admin (roles 2 and 3) can access staff routes
router.use(authenticate, authorizeRoles(2, 3));

// My assignments & permissions
router.get("/my-assignments", getMyAssignments);

// RN Submissions (for GRADER)
router.get("/rn-submissions", getRNSubmissions);
router.post("/rn-submissions/:id/run", runRNSubmission);
router.patch("/rn-submissions/:id/status", updateRNSubmissionStatus);
router.post("/rn-submissions/:id/grade", gradeSubmission);

// Slot monitoring (for SLOT_SUPERVISOR)
router.get("/slot/:id/students", getSlotStudents);
router.post("/slot/:id/revoke/:sessionId", revokeSlotStudent);
router.post("/slot/:id/extend/:sessionId", extendStudentTime);

// Question Pool Management
router.get("/pool/config", getPoolConfig);
router.patch("/pool/config", updatePoolConfig);
router.get("/pool/preview", previewPool);

// Analytics
router.get("/analytics", getStudentAnalytics);

export default router;