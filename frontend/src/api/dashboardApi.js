/**
 * Dashboard API
 * Handles fetching admin dashboard metrics and performance data
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

/**
 * Fetch dashboard metrics
 */
export function fetchDashboardMetrics() {
    return request(`${API_BASE}/api/admin/dashboard/metrics`);
}

/**
 * Fetch performance data
 * @param {string} level - Filter by level (optional)
 * @param {string} period - Time period: '7d', '30d', 'all'
 */
export function fetchPerformanceData(level = 'all', period = '30d') {
    return request(`${API_BASE}/api/admin/dashboard/performance?level=${level}&period=${period}`);
}

/**
 * Fetch available levels dynamically
 */
export function fetchAvailableLevels() {
    // This will be derived from the performance data or problems
    // For now, return hardcoded levels (can be improved later)
    return Promise.resolve({
        levels: [
            { id: 1, name: 'Level 1', number: 1 },
            { id: 2, name: 'Level 2', number: 2 },
            { id: 3, name: 'Level 3', number: 3 },
            { id: 4, name: 'Level 4', number: 4 },
            { id: 5, name: 'Level 5', number: 5 },
        ]
    });
}
