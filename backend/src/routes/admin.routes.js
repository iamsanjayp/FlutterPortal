import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import {
	getMetrics,
	getSchedules,
	createSchedule,
	updateSchedule,
	resetQuestions,
	getSessions,
	resetSessionLogin,
	forceLogoutSession,
	updateSessionDuration,
	reinstateSession,
	getSubmissions,
	updateSubmissionStatus,
	getStudents,
	updateStudentStatus,
	getStudentSessions,
	updateStudentLevel,
	updateSessionResult,
	getProblems,
	createProblem,
	updateProblem,
	deleteProblem,
	getProblemTestCases,
	createTestCase,
	updateTestCase,
	deleteTestCase,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticate, authorizeRoles(3));

router.get("/metrics", getMetrics);
router.get("/schedules", getSchedules);
router.post("/schedules", createSchedule);
router.patch("/schedules/:id", updateSchedule);

router.post("/sessions/reset-questions", resetQuestions);
router.get("/sessions", getSessions);
router.post("/sessions/:id/reset-login", resetSessionLogin);
router.post("/sessions/:id/force-logout", forceLogoutSession);
router.patch("/sessions/:id/duration", updateSessionDuration);
router.patch("/sessions/:id/result", updateSessionResult);
router.post("/sessions/:id/reinstate", reinstateSession);
router.get("/submissions", getSubmissions);
router.patch("/submissions/:id/status", updateSubmissionStatus);

router.get("/students", getStudents);
router.patch("/students/:id/status", updateStudentStatus);
router.patch("/students/:id/level", updateStudentLevel);
router.get("/students/:id/sessions", getStudentSessions);

router.get("/problems", getProblems);
router.post("/problems", createProblem);
router.patch("/problems/:id", updateProblem);
router.delete("/problems/:id", deleteProblem);
router.get("/problems/:id/test-cases", getProblemTestCases);
router.post("/problems/:id/test-cases", createTestCase);
router.patch("/test-cases/:id", updateTestCase);
router.delete("/test-cases/:id", deleteTestCase);

export default router;
