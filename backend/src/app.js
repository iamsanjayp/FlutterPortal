import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "passport";
import cookieParser from "cookie-parser";
import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import executeRoutes from "./routes/execute.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import testRoutes from "./routes/test.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { auditLog } from "./middleware/audit.middleware.js";




const app = express();

// Security headers
app.use(helmet());

// CORS — normalize origins (add http:// if no protocol) and validate
const rawOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)
  .map(origin => /^https?:\/\//.test(origin) ? origin : `http://${origin}`);
const corsOrigins = rawOrigins.filter(origin =>
  /^https?:\/\/[a-zA-Z0-9.\-]+(:\d+)?$/.test(origin)
);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Audit logging for state-changing requests
app.use(auditLog);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,                  // 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api", protectedRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

export default app;
