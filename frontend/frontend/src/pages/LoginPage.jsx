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

          {error && <div className="text-sm text-red-600">{error}</div>}

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
