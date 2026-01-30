import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export async function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.query(
      "SELECT id, role_id, active_session_id FROM users WHERE id = ? AND is_active = true",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid user" });
    }

    if (!users[0].active_session_id || users[0].active_session_id !== decoded.sessionId) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = {
      id: users[0].id,
      roleId: users[0].role_id,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
