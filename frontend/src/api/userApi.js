/**
 * User Management API
 * Handles fetching and managing users (students, staff, admins)
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
 * Fetch users with filters
 * @param {Object} params - { role, level, status, search, page, limit }
 */
export async function fetchUsers(params = {}) {
    const query = new URLSearchParams();
    
    if (params.role) query.append('role', params.role);
    if (params.level) query.append('level', params.level);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    
    return request(`${API_BASE}/api/admin/users?${query.toString()}`);
}

/**
 * Update user role
 */
export async function updateUserRole(userId, newRole) {
    return request(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
    });
}

/**
 * Update user status (enable/disable)
 */
export async function updateUserStatus(userId, newStatus) {
    return request(`${API_BASE}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    });
}
