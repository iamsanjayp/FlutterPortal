import express from 'express'; // backend restart trigger
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import "./config/passport.js";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import testRoutes from "./routes/test.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import reactNativeRoutes from "./routes/reactNative.routes.js";
import reactNativeProblemRoutes from "./routes/reactNativeProblem.routes.js";
import rnSubmissionRoutes from "./routes/rnSubmission.routes.js";
import sessionRoutes from "./routes/session.routes.js";





// Force restart
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/react-native/problems", reactNativeProblemRoutes);
app.use("/api/react-native", rnSubmissionRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/execute", reactNativeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", protectedRoutes);
app.use("/api/staff", staffRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

export default app;
