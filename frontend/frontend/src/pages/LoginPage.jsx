import { useState } from "react";
import { startGoogleLogin, loginWithPassword } from "../api/authApi";
import ErrorPage from "./ErrorPage";

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isScheduleError = error?.includes("Login allowed only during scheduled tests") || 
                          error?.includes("Test portal is not scheduled") ||
                          error?.includes("No active test");
  const isInactiveError = error?.includes("Account disabled") || error?.includes("inactive");

  if (isScheduleError) {
    return <ErrorPage type="schedule" onBack={() => setError("")} />;
  }

  if (isInactiveError) {
    return <ErrorPage type="inactive" onBack={() => setError("")} />;
  }

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await loginWithPassword({ email, password });
      await onLogin();
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">
          PCDP Flutter Portal
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in with your bitsathy account
        </p>

        <form onSubmit={handlePasswordLogin} className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={startGoogleLogin}
          className="mt-4 w-full rounded-md border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 hover:border-blue-300 flex items-center justify-center gap-2"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="h-4 w-4"
          />
          Sign in with Google
        </button>

        {error && !isScheduleError && !isInactiveError && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
