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
	createStudent,
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
	getRNSubmissions,
	runRNSubmission,
	updateRNSubmissionStatus,

    gradeSubmission,
    assignStaffToSchedule,
    getScheduleAssignments,
    removeStaffAssignment,
    createStaffUser,
    getStaffList,
    setStaffPermissions
} from "../controllers/admin.controller.js";
import {
	getDashboardMetrics,
	getPerformanceData,
	getAllUsers,
	getUserById,
	updateUserRole,
	updateUserStatus,
} from "../controllers/dashboard.controller.js";
import {
  getQuestionsByFilter, getQuestionByIdNew, createQuestionNew, updateQuestionNew, deleteQuestionNew, toggleQuestionStatus,
  getSkills, getLevels, getSubLevels
} from "../controllers/question.controller.js";
import { getSettings, updateSettings } from "../controllers/system.controller.js";

const router = express.Router();

router.use(authenticate, authorizeRoles(3));

router.post("/students", createStudent);

router.get("/metrics", getMetrics);
router.get("/schedules", getSchedules);
router.post("/schedules", createSchedule);
router.patch("/schedules/:id", updateSchedule);
router.post("/schedules/:id/assign", assignStaffToSchedule);
router.get("/schedules/:id/assignments", getScheduleAssignments);
router.delete("/schedules/:id/assign/:userId", removeStaffAssignment);

// Staff Management
router.get("/staff", getStaffList);
router.post("/staff", createStaffUser);
router.patch("/staff/:userId/permissions", setStaffPermissions);

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
// router.post("/students", createStudent);
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

// React Native submissions (admin)
router.get("/rn-submissions", getRNSubmissions);
router.post("/rn-submissions/:id/run", runRNSubmission);
router.patch("/rn-submissions/:id/status", updateRNSubmissionStatus);
router.post("/rn-submissions/:id/grade", gradeSubmission);

// Dashboard & User Management
router.get("/dashboard/metrics", getDashboardMetrics);
router.get("/dashboard/performance", getPerformanceData);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);

router.patch("/users/:id/status", updateUserStatus);

// Skill/Level/Sub-level APIs
router.get("/skills", getSkills);
router.get("/levels", getLevels);
router.get("/sub-levels", getSubLevels);

// Question Management
router.get("/questions", getQuestionsByFilter);
router.get("/questions/:id", getQuestionByIdNew);
router.post("/questions", createQuestionNew);
router.patch("/questions/:id", updateQuestionNew);
router.delete("/questions/:id", deleteQuestionNew);
router.patch("/questions/:id/status", toggleQuestionStatus);

// System Settings
router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

export default router;
