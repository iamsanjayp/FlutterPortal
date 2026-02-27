/**
 * API for Question Management
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

// Fetch questions with filters
export function fetchQuestions(params = {}) {
    const query = new URLSearchParams();
    if (params.skill && params.skill !== 'all') query.append('skill', params.skill);
    if (params.level && params.level !== 'all') query.append('level', params.level);
    if (params.subLevel && params.subLevel !== 'all') query.append('subLevel', params.subLevel);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    return request(`${API_BASE}/api/admin/questions?${query.toString()}`);
}

// Get single question details
export function fetchQuestionById(id) {
    return request(`${API_BASE}/api/admin/questions/${id}`);
}

// Create new question
export function createQuestion(data) {
    return request(`${API_BASE}/api/admin/questions`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// Update existing question
export function updateQuestion(id, data) {
    return request(`${API_BASE}/api/admin/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// Soft delete question
export function deleteQuestion(id) {
    return request(`${API_BASE}/api/admin/questions/${id}`, {
        method: 'DELETE'
    });
}

// Toggle question status
export function toggleQuestionStatus(id) {
    return request(`${API_BASE}/api/admin/questions/${id}/status`, {
        method: 'PATCH'
    });
}

// Fetch dynamic skills
export function fetchSkills() {
    return request(`${API_BASE}/api/admin/skills`);
}

// Fetch dynamic levels based on skill
export function fetchLevels(skill) {
    const query = skill ? `?skill=${skill}` : '';
    return request(`${API_BASE}/api/admin/levels${query}`);
}

// Fetch dynamic sub-levels based on skill and level
export function fetchSubLevels(skill, level) {
    const query = new URLSearchParams();
    if (skill) query.append('skill', skill);
    if (level) query.append('level', level);
    return request(`${API_BASE}/api/admin/sub-levels?${query.toString()}`);
}
