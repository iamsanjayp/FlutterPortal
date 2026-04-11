import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import TestPage from "./pages/TestPage";
import TestResultPage from "./pages/TestResultPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import { fetchMe, logout } from "./api/authApi";
import { startTest } from "./api/testApi";
import UITestPage from "./pages/UITestPage";

// Auth context to share user state across routes
const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionCount, setQuestionCount] = useState(2);
  const [assessmentType, setAssessmentType] = useState("TEST_CASE");
  const [passThreshold, setPassThreshold] = useState(85);
  const [sessionId, setSessionId] = useState(null);
  const [finishSummary, setFinishSummary] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      const data = await fetchMe();
      setUser(data.user);
      setLevel(data.level);
      setDurationMinutes(data.durationMinutes);
      setQuestionCount(data.questionCount);
      setAssessmentType(data.assessmentType || "TEST_CASE");
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleLogout = useCallback(async () => {
    await logout();
    setUser(null);
    setSessionId(null);
    setFinishSummary(null);
  }, []);

  const handleLaunch = useCallback(async () => {
    const res = await startTest();
    setSessionId(res.sessionId);
    setLevel(res.level);
    setDurationMinutes(res.durationMinutes);
    setQuestionCount(res.questionCount);
    setAssessmentType(res.assessmentType || "TEST_CASE");
    setPassThreshold(res.passThreshold || 85);
    return res;
  }, []);

  const handleFinish = useCallback((summary) => {
    setFinishSummary(summary);
  }, []);

  const value = {
    loading, user, level, durationMinutes, questionCount,
    assessmentType, passThreshold, sessionId, finishSummary,
    loadUser, handleLogout, handleLaunch, handleFinish,
    setSessionId, setFinishSummary,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Route guard: redirects to /login if not authenticated
function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading…</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role_id)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Route guard: redirects authenticated users away from login
function RequireGuest({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading…</div>;

  if (user) {
    if (user.role_id === 3 || user.role_id === 2) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Wrapper pages that connect to AuthContext and use navigate
function LoginPageRoute() {
  const { loadUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    const u = await loadUser();
    if (u) {
      if (u.role_id === 3 || u.role_id === 2) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }

  return <LoginPage onLogin={handleLogin} />;
}

function DashboardRoute() {
  const { user, level, durationMinutes, questionCount, handleLogout, handleLaunch } = useAuth();
  const navigate = useNavigate();

  async function onLaunch() {
    try {
      await handleLaunch();
      navigate("/test", { replace: true });
    } catch (err) {
      window.alert(err?.message || "Unable to start test");
    }
  }

  async function onLogout() {
    await handleLogout();
    navigate("/login", { replace: true });
  }

  return (
    <StudentDashboard
      user={user}
      level={level}
      durationMinutes={durationMinutes}
      questionCount={questionCount}
      onLaunch={onLaunch}
      onLogout={onLogout}
    />
  );
}

function AdminRoute() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await handleLogout();
    navigate("/login", { replace: true });
  }

  return <AdminLayout user={user} onLogout={onLogout} />;
}

function TestRoute() {
  const {
    sessionId, durationMinutes, level, assessmentType,
    passThreshold, handleLogout, handleFinish,
  } = useAuth();
  const navigate = useNavigate();

  if (!sessionId) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onLogout() {
    await handleLogout();
    navigate("/login", { replace: true });
  }

  function onExit() {
    navigate("/dashboard", { replace: true });
  }

  function onFinish(summary) {
    handleFinish(summary);
    navigate("/result", { replace: true });
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      {assessmentType === "UI_COMPARE" ? (
        <UITestPage
          sessionId={sessionId}
          durationMinutes={durationMinutes}
          level={level}
          passThreshold={passThreshold}
          onExit={onExit}
          onLogout={onLogout}
          onFinish={onFinish}
        />
      ) : (
        <TestPage
          sessionId={sessionId}
          durationMinutes={durationMinutes}
          level={level}
          onExit={onExit}
          onLogout={onLogout}
          onFinish={onFinish}
        />
      )}
    </div>
  );
}

function ResultRoute() {
  const { sessionId, finishSummary, handleLogout } = useAuth();
  const navigate = useNavigate();

  if (!sessionId && !finishSummary) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onDone() {
    await handleLogout();
    navigate("/login", { replace: true });
  }

  return (
    <TestResultPage
      sessionId={sessionId}
      summary={finishSummary}
      onDone={onDone}
    />
  );
}

// Root redirect based on role
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading…</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role_id === 3 || user.role_id === 2) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <RequireGuest>
                <LoginPageRoute />
              </RequireGuest>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth allowedRoles={[1]}>
                <DashboardRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/test"
            element={
              <RequireAuth allowedRoles={[1]}>
                <TestRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/result"
            element={
              <RequireAuth allowedRoles={[1]}>
                <ResultRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireAuth allowedRoles={[2, 3]}>
                <AdminRoute />
              </RequireAuth>
            }
          />
          {/* Catch-all: redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
