import { useState } from "react";
import { loginWithPassword, startGoogleLogin } from "../api/authApi";

export default function LoginPage({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithPassword({ identifier, password });
      onLogin();
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  const isScheduleError = error?.includes("Login allowed only during scheduled tests");
  const errorMessage = isScheduleError
    ? "No active test right now. Please try again when the test window opens."
    : error;

  if (isScheduleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-semibold">
            !
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">No Active Test</h1>
          <p className="mt-2 text-sm text-slate-600">
            The test portal is only available during scheduled slots. Please check back when the test window opens.
          </p>
          <button
            type="button"
            onClick={() => setError("")}
            className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-sky-300"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          Student Login
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sign in to launch your test portal.
        </p>

        <button
          type="button"
          onClick={startGoogleLogin}
          className="mt-4 w-full rounded-md border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:border-sky-300"
        >
          Sign in with Google
        </button>

        <div className="my-4 text-center text-xs text-slate-400">
          OR
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">Email / Enrollment / Roll</label>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Enter identifier"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Enter password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-sky-500 py-2 text-white text-sm"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
