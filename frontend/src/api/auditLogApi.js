/**
 * Admin Audit Logs API
 * Handles fetching audit log data with filtering and pagination
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
 * Fetch audit logs with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.actionType - Filter by action type (LOGIN, ROLE_CHANGE, QUESTION_UPDATE, TEST_TOGGLE)
 * @param {string} params.startDate - Start date for filter (ISO string)
 * @param {string} params.endDate - End date for filter (ISO string)
 * @param {number} params.page - Page number (1-indexed)
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} - { logs: [], total, page, totalPages }
 */
export async function fetchAuditLogs(params = {}) {
    const { actionType, startDate, endDate, page = 1, limit = 20 } = params;
    
    const queryParams = new URLSearchParams();
    if (actionType && actionType !== 'ALL') queryParams.append('actionType', actionType);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    return request(`${API_BASE}/api/admin/audit-logs?${queryParams.toString()}`);
}

// Mock data generator for development
export function generateMockAuditLogs(count = 50) {
    const actionTypes = ['LOGIN', 'ROLE_CHANGE', 'QUESTION_UPDATE', 'TEST_TOGGLE'];
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@mobiledev.com' },
        { id: 2, name: 'Staff Coordinator', email: 'staff@mobiledev.com' },
        { id: 3, name: 'Rahul Kumar', email: 'rahul.kumar@student.edu' },
    ];
    
    const logs = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const timestamp = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        
        let actionDetails = '';
        switch (actionType) {
            case 'LOGIN':
                actionDetails = `Successful login from ${['Web', 'Mobile'][Math.floor(Math.random() * 2)]}`;
                break;
            case 'ROLE_CHANGE':
                actionDetails = `Changed user role from Student to ${['Staff', 'Admin'][Math.floor(Math.random() * 2)]}`;
                break;
            case 'QUESTION_UPDATE':
                actionDetails = `Updated problem: ${['Reverse String','Sum of Squares', 'Counter App'][Math.floor(Math.random() * 3)]}`;
                break;
            case 'TEST_TOGGLE':
                actionDetails = `${['Enabled', 'Disabled'][Math.floor(Math.random() * 2)]} Level 3A assessment`;
                break;
        }
        
        logs.push({
            id: i + 1,
            timestamp: timestamp.toISOString(),
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            action_type: actionType,
            action_details: actionDetails,
            ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        });
    }
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
