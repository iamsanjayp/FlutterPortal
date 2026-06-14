import express from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { signAccessToken } from "../utils/jwt.js";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const router = express.Router();
const cookieMaxAgeMs = Number(process.env.JWT_COOKIE_MAX_AGE_MS) || 1 * 60 * 60 * 1000; // default 1h

// Only set secure cookies if the site is actually served over HTTPS
const frontendUrl = process.env.FRONTEND_URL || "";
const useSecureCookies = frontendUrl.startsWith("https://");

// Cookie options — secure only when HTTPS is in use
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAgeMs,
  };
}

// Rate limiters for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 login attempts per window
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

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
        return res.status(403).json({ message: "Invalid credentials" });
      }

      if (dbUser.role_id === 1 && dbUser.active_session_id) {
        return res.status(409).json({ message: "Account already active on another device" });
      }

      // Generate JWT + session ID
      const { token, sessionId } = signAccessToken(req.user);

      // Store active session only for students (single-device lock)
      if (dbUser.role_id === 1) {
        await pool.query(
          "UPDATE users SET active_session_id = ? WHERE id = ?",
          [sessionId, req.user.id]
        );
      }

      // Set HTTP-only cookie
      res.cookie("access_token", token, getCookieOptions());

      const redirectUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${redirectUrl}?login=success`);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  }
);

/**
 * Username/password login (LOCAL users)
 */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const [[dbUser]] = await pool.query(
      "SELECT id, role_id, is_active, active_session_id, auth_provider, password_hash FROM users WHERE email = ?",
      [email]
    );

    // Generic error for all auth failures to prevent user enumeration
    if (!dbUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (dbUser.is_active !== 1) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (dbUser.role_id === 1 && dbUser.active_session_id) {
      return res.status(409).json({ error: "Account already active on another device" });
    }

    if (dbUser.auth_provider && dbUser.auth_provider !== "LOCAL") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!dbUser.password_hash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, dbUser.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { token, sessionId } = signAccessToken(dbUser);

    if (dbUser.role_id === 1) {
      await pool.query(
        "UPDATE users SET active_session_id = ? WHERE id = ?",
        [sessionId, dbUser.id]
      );
    }

    res.cookie("access_token", token, getCookieOptions());

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Password login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
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
