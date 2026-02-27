import express from "express";
import passport from "passport";
import { signAccessToken } from "../utils/jwt.js";
import { getActiveSchedule } from "../utils/schedule.js";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

const router = express.Router();

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
        "SELECT id, role_id, is_active FROM users WHERE id = ?",
        [req.user.id]
      );

      if (!dbUser || dbUser.is_active !== 1) {
        return res.status(403).json({ message: "Account disabled" });
      }

      if (dbUser.role_id !== 3) {
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
        maxAge: 15 * 60 * 1000, // 15 minutes
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
 * Username/password login
 */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const [users] = await pool.query(
      `
      SELECT id, full_name, email, password_hash, role_id
      FROM users
      WHERE (email = ? OR enrollment_no = ? OR roll_no = ? OR staff_id = ?)
        AND is_active = true
      LIMIT 1
      `,
      [identifier, identifier, identifier, identifier]
    );

    if (!users.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash || "");

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.role_id !== 3) {
      const schedule = await getActiveSchedule();
      if (!schedule) {
        return res.status(403).json({ error: "Login allowed only during scheduled tests" });
      }
    }

    const { token, sessionId } = signAccessToken(user);

    await pool.query(
      "UPDATE users SET active_session_id = ? WHERE id = ?",
      [sessionId, user.id]
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * Development Bypass Login
 * POST /auth/dev-login
 * Body: { email: "..." }
 */
router.post("/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed in production" });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Generate JWT + session ID
    const { token, sessionId } = signAccessToken(user);

    // Store active session in DB
    await pool.query(
      "UPDATE users SET active_session_id = ? WHERE id = ?",
      [sessionId, user.id]
    );

    // Set HTTP-only cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false, 
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000, 
    });

    res.json({
      message: "Dev login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
      },
      warning: "Bypassed active schedule check for development"
    });

  } catch (err) {
    console.error("Dev Login error:", err);
    res.status(500).json({ error: "Dev login failed" });
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
