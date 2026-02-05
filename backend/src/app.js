import express from "express";
import path from "path";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import executeRoutes from "./routes/execute.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import testRoutes from "./routes/test.routes.js";
import adminRoutes from "./routes/admin.routes.js";




const app = express();

const corsOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

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
