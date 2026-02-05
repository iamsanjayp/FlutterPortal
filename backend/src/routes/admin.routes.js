import express from "express";
import multer from "multer";
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
	resetUserLogin,
	forceLogoutUser,
	updateSessionDuration,
	reinstateSession,
	getSubmissions,
	updateSubmissionStatus,
	deleteSubmission,
	getStudents,
	updateStudentStatus,
	getStudentSessions,
	updateStudentLevel,
	updateSessionResult,
	getProblems,
	createProblem,
	updateProblem,
	deleteProblem,
	getLevels,
	createLevel,
	updateLevel,
	uploadReferenceImage,
	getProblemTestCases,
	createTestCase,
	updateTestCase,
	deleteTestCase,
	getUISubmissions,
	submitManualGrade,
	createUser,
	extendScheduleDuration,
	updateUser,
	bulkCreateUsers,
	bulkCreateProblems,
} from "../controllers/admin.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get("/metrics", authorizeRoles(2, 3), getMetrics);
router.get("/schedules", authorizeRoles(2, 3), getSchedules);
router.post("/schedules", authorizeRoles(3), createSchedule);
router.patch("/schedules/:id", authorizeRoles(3), updateSchedule);

router.post("/sessions/reset-questions", authorizeRoles(3), resetQuestions);
router.get("/sessions", authorizeRoles(2, 3), getSessions);
router.post("/sessions/:id/reset-login", authorizeRoles(2, 3), resetSessionLogin);
router.post("/sessions/:id/force-logout", authorizeRoles(2, 3), forceLogoutSession);
router.post("/users/:id/reset-login", authorizeRoles(2, 3), resetUserLogin);
router.post("/users/:id/force-logout", authorizeRoles(2, 3), forceLogoutUser);
router.patch("/sessions/:id/duration", authorizeRoles(2, 3), updateSessionDuration);
router.post("/schedules/:id/extend-duration", authorizeRoles(2, 3), extendScheduleDuration);
router.patch("/sessions/:id/result", authorizeRoles(3), updateSessionResult);
router.post("/sessions/:id/reinstate", authorizeRoles(2, 3), reinstateSession);
router.get("/submissions", authorizeRoles(2, 3), getSubmissions);
router.patch("/submissions/:id/status", authorizeRoles(2, 3), updateSubmissionStatus);
router.delete("/submissions/:id", authorizeRoles(3), deleteSubmission);

router.get("/students", authorizeRoles(3), getStudents);
router.post("/users", authorizeRoles(3), createUser);
router.patch("/users/:id", authorizeRoles(3), updateUser);
router.post("/users/bulk", authorizeRoles(3), upload.single("file"), bulkCreateUsers);
router.patch("/students/:id/status", authorizeRoles(3), updateStudentStatus);
router.patch("/students/:id/level", authorizeRoles(3), updateStudentLevel);
router.get("/students/:id/sessions", authorizeRoles(3), getStudentSessions);

router.get("/problems", authorizeRoles(2, 3), getProblems);
router.post("/problems", authorizeRoles(2, 3), createProblem);
router.post("/problems/bulk", authorizeRoles(2, 3), upload.single("file"), bulkCreateProblems);
router.patch("/problems/:id", authorizeRoles(2, 3), updateProblem);
router.delete("/problems/:id", authorizeRoles(3), deleteProblem);
router.get("/levels", authorizeRoles(2, 3), getLevels);
router.post("/levels", authorizeRoles(3), createLevel);
router.patch("/levels/:code", authorizeRoles(3), updateLevel);
router.post("/problems/:id/reference-image", authorizeRoles(2, 3), upload.single("image"), uploadReferenceImage);
router.get("/problems/:id/test-cases", authorizeRoles(3), getProblemTestCases);
router.post("/problems/:id/test-cases", authorizeRoles(3), createTestCase);
router.patch("/test-cases/:id", authorizeRoles(3), updateTestCase);
router.delete("/test-cases/:id", authorizeRoles(3), deleteTestCase);

// Manual Grading Routes
router.get("/submissions/ui", authorizeRoles(2, 3), getUISubmissions);
router.post("/submissions/:id/manual-grade", authorizeRoles(2, 3), submitManualGrade);

export default router;
