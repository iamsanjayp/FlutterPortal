import express from "express";
import passport from "passport";
import { signAccessToken } from "../utils/jwt.js";
import { getActiveSchedule } from "../utils/schedule.js";
import pool from "../config/db.js";

const router = express.Router();
const cookieMaxAgeMs = Number(process.env.JWT_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000;

/**
 * STEP 1: Redirect user to Google login
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/**
 * STEP 2: Google OAuth callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/failed",
  }),
  async (req, res) => {
    try {
      const [[dbUser]] = await pool.query(
        "SELECT id, role_id, is_active, active_session_id FROM users WHERE id = ?",
        [req.user.id]
      );

      if (!dbUser || dbUser.is_active !== 1) {
        return res.status(403).json({ message: "Account disabled" });
      }

      if (dbUser.active_session_id) {
        return res.status(409).json({ message: "Account already active on another device" });
      }

      if (dbUser.role_id === 1) {
        const schedule = await getActiveSchedule();
        if (!schedule) {
          return res.status(403).json({ message: "Login allowed only during scheduled tests" });
        }
      }

      // Generate JWT + session ID
      const { token, sessionId } = signAccessToken(req.user);

      // Store active session in DB (single-device lock)
      await pool.query(
        "UPDATE users SET active_session_id = ? WHERE id = ?",
        [sessionId, req.user.id]
      );

      // Set HTTP-only cookie
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: false,      // true in production (HTTPS)
        sameSite: "lax",
        path: "/",
        maxAge: cookieMaxAgeMs,
      });

      const redirectUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${redirectUrl}?login=success`);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  }
);

/**
 * Username/password login removed (Google-only)
 */
router.post("/login", (req, res) => {
  res.status(404).json({ error: "Password login disabled" });
});

/**
 * Login failure handler
 */
router.get("/failed", (req, res) => {
  res.status(401).json({ message: "Google authentication failed" });
});

/**
 * Logout (clears cookie + session)
 */
router.post("/logout", async (req, res) => {
  try {
    if (req.cookies?.access_token) {
      // Decode token to get user ID
      const jwt = (await import("jsonwebtoken")).default;
      const decoded = jwt.verify(
        req.cookies.access_token,
        process.env.JWT_SECRET
      );

      // Clear active session in DB
      await pool.query(
        "UPDATE users SET active_session_id = NULL WHERE id = ?",
        [decoded.userId]
      );
    }

    // Clear cookie
    res.clearCookie("access_token", { path: "/" });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.clearCookie("access_token", { path: "/" });
    res.json({ message: "Logged out successfully" });
  }
});

export default router;
