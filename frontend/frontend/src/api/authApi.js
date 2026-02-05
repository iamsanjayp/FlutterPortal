const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "API error" }));
    throw new Error(err.error || err.message || "API error");
  }

  return res.json();
}


export function fetchMe() {
  return request(`${API_BASE}/api/me`);
}

export function logout() {
  return request(`${API_BASE}/auth/logout`, {
    method: "POST",
  });
}

export function startGoogleLogin() {
  window.location.href = `${API_BASE}/auth/google`;
}
