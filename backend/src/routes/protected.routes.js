import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import pool from "../config/db.js";
import { getCurrentLevel, getLevelConfig } from "../utils/level.js";

const router = express.Router();

// Any logged-in user
router.get("/me", authenticate, async (req, res) => {
  const [[user]] = await pool.query(
    `
    SELECT id, full_name, email, enrollment_no, roll_no, staff_id, role_id
    FROM users
    WHERE id = ?
    `,
    [req.user.id]
  );

  const level = await getCurrentLevel(req.user.id);
  const { durationMinutes, questionCount, assessmentType } = await getLevelConfig(level);

  res.json({
    message: "Authenticated",
    user,
    level,
    durationMinutes,
    questionCount,
    assessmentType,
  });
});

// Admin-only route (role_id = ADMIN)
router.get(
  "/admin",
  authenticate,
  authorizeRoles(3), // ADMIN role id
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

export default router;
