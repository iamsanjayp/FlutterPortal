import { useEffect, useState } from "react";
import TestPage from "./pages/TestPage";
import TestResultPage from "./pages/TestResultPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import { fetchMe, logout } from "./api/authApi";
import { startTest } from "./api/testApi";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionCount, setQuestionCount] = useState(2);
  const [stage, setStage] = useState("login");
  const [sessionId, setSessionId] = useState(null);
  const [finishSummary, setFinishSummary] = useState(null);

  async function loadUser() {
    try {
      const data = await fetchMe();
      setUser(data.user);
      setLevel(data.level);
      setDurationMinutes(data.durationMinutes);
      setQuestionCount(data.questionCount);
      if (data.user?.role_id === 3) {
        setStage("admin");
      } else {
        setStage("dashboard");
      }
    } catch {
      setStage("login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function handleLaunch() {
    try {
      const res = await startTest();
      setSessionId(res.sessionId);
      setLevel(res.level);
      setDurationMinutes(res.durationMinutes);
      setQuestionCount(res.questionCount);
      setStage("portal");
    } catch (err) {
      window.alert(err?.message || "Unable to start test");
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setSessionId(null);
    setFinishSummary(null);
    setStage("login");
  }

  function handleFinish(summary) {
    setFinishSummary(summary);
    setStage("result");
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (stage === "login") {
    return <LoginPage onLogin={loadUser} />;
  }

  if (stage === "dashboard") {
    return (
      <StudentDashboard
        user={user}
        level={level}
        durationMinutes={durationMinutes}
        questionCount={questionCount}
        onLaunch={handleLaunch}
        onLogout={handleLogout}
      />
    );
  }

  if (stage === "admin") {
    return <AdminLayout user={user} onLogout={handleLogout} />;
  }

  if (stage === "result") {
    return (
      <TestResultPage
        sessionId={sessionId}
        summary={finishSummary}
        onDone={handleLogout}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <TestPage
        sessionId={sessionId}
        durationMinutes={durationMinutes}
        level={level}
        onExit={() => setStage("dashboard")}
        onLogout={handleLogout}
        onFinish={handleFinish}
      />
    </div>
  );
}
