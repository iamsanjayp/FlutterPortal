/**
 * API for Question Pool Management
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

// Get pool configuration
export function fetchPoolConfig(skill, levelNumber, subLevel) {
    const query = new URLSearchParams({ skill, levelNumber, subLevel });
    return request(`${API_BASE}/api/staff/pool/config?${query.toString()}`);
}

// Update pool configuration
export function updatePoolConfig(data) {
    return request(`${API_BASE}/api/staff/pool/config`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// Preview pool random selection
export function previewPool(skill, levelNumber, subLevel, count) {
    const query = new URLSearchParams({ skill, levelNumber, subLevel, count });
    return request(`${API_BASE}/api/staff/pool/preview?${query.toString()}`);
}
