/**
 * API for System Settings
 */

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
        let payload = null;
        try {
            payload = await res.json();
        } catch {
            const text = await res.text().catch(() => "");
            throw new Error(text || `API error (${res.status})`);
        }
        throw new Error(payload.error || payload.message || `API error (${res.status})`);
    }

    return res.json();
}

export function fetchSettings() {
    return request(`${API_BASE}/api/admin/settings`);
}

export function updateSettings(settings) {
    return request(`${API_BASE}/api/admin/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ settings })
    });
}
