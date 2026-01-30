import express from "express";
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

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

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
