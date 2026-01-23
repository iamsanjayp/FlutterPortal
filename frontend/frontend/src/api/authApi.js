const API_BASE = "http://localhost:5000";

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

export function loginWithPassword(payload) {
  return request(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
