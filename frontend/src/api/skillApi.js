/**
 * Skill API
 * Handles fetching skills, levels, and sub-levels for dynamic navigation
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
 * Fetch all skills with nested levels and sub-levels
 */
export function fetchSkills() {
    // TODO: Replace with actual API call when backend is ready
    // return request(`${API_BASE}/api/admin/skills`);
    
    // Return mock data for now
    return Promise.resolve({
        skills: MOCK_SKILLS
    });
}

/**
 * Fetch questions for a specific skill/level/sub-level
 */
export function fetchQuestionsByPath(skill, level, subLevel) {
    return request(`${API_BASE}/api/admin/skills/${skill}/${level}/${subLevel}/questions`);
}

// Mock data structure
const MOCK_SKILLS = [
    {
        id: 2,
        name: "React Native Development",
        slug: "react-native",
        description: "Mobile app development with React Native",
        is_active: true,
        levels: [
            {
                id: 4,
                level_number: 1,
                name: "Level 1",
                description: "Beginner level",
                sub_levels: [
                    {
                        id: 10,
                        code: "A",
                        name: "Sub-level A",
                        question_count: 6
                    },
                    {
                        id: 11,
                        code: "B",
                        name: "Sub-level B",
                        question_count: 7
                    },
                    {
                        id: 12,
                        code: "C",
                        name: "Sub-level C",
                        question_count: 5
                    }
                ]
            },
            {
                id: 5,
                level_number: 2,
                name: "Level 2",
                description: "Intermediate level",
                sub_levels: [
                    {
                        id: 13,
                        code: "A",
                        name: "Sub-level A",
                        question_count: 8
                    },
                    {
                        id: 14,
                        code: "B",
                        name: "Sub-level B",
                        question_count: 9
                    },
                    {
                        id: 15,
                        code: "C",
                        name: "Sub-level C",
                        question_count: 7
                    }
                ]
            },
            {
                id: 6,
                level_number: 3,
                name: "Level 3",
                description: "Advanced level (React Native UI)",
                sub_levels: [
                    {
                        id: 16,
                        code: "A",
                        name: "Sub-level A",
                        question_count: 8,
                        question_types: [
                            { type: 'CODE', count: 5 },
                            { type: 'UI', count: 3 }
                        ]
                    }
                ]
            }
        ]
    }
];
