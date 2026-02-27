import { createContext, useContext, useState, useEffect } from 'react';
import { fetchMe, logout as apiLogout } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Derive role from user.role_id
    const role = user?.role_id === 3 ? 'admin' : user?.role_id === 2 ? 'staff' : user?.role_id === 1 ? 'student' : null;

    // Load user on mount
    useEffect(() => {
        refreshUser();
    }, []);

    async function refreshUser() {
        try {
            setLoading(true);
            const data = await fetchMe();
            setUser({ ...data.user, level: data.level, durationMinutes: data.durationMinutes, questionCount: data.questionCount });
            setIsAuthenticated(true);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        try {
            await apiLogout();
        } catch (err) {
            console.error('Logout error:', err);
        }

        // Clear localStorage
        localStorage.removeItem('assessment_session');
        localStorage.removeItem('current_problem');
        localStorage.removeItem('assessment_code');

        setUser(null);
        setIsAuthenticated(false);
    }

    const value = {
        user,
        role,
        isAuthenticated,
        loading,
        refreshUser,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
