import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import DynamicSidebar from '../../components/DynamicSidebar';
import AdminHome from './AdminHome';
import QuestionManager from './QuestionManager';
import AdminTestSlots from './AdminTestSlots';
import AdminLiveTests from './AdminLiveTests';
import AdminUsers from './AdminUsers';
import AdminSubmissions from './AdminSubmissions';
import AdminAuditLogs from './AdminAuditLogs';
import DynamicQuestions from './DynamicQuestions';
import { fetchAdminMetrics } from '../../api/adminApi';

export default function AdminLayout({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [activePath, setActivePath] = useState(location.pathname);
    const [activeTestsCount, setActiveTestsCount] = useState(0);

    // Update active path when location changes
    useEffect(() => {
        setActivePath(location.pathname);
    }, [location]);

    // Fetch active tests count from the real API
    useEffect(() => {
        fetchAdminMetrics()
            .then(data => setActiveTestsCount(data.activeSessions || 0))
            .catch(() => setActiveTestsCount(0));
    }, [location.pathname]); // Refresh on navigation

    function handleNavigate(path) {
        navigate(path);
    }

    return (
        <div className="min-h-screen bg-main text-text-primary flex">
            {/* Dynamic Sidebar */}
            <DynamicSidebar
                role={user?.role || 'admin'}
                activePath={activePath}
                onNavigate={handleNavigate}
                onLogout={onLogout}
            />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 ml-[240px]">
                {/* Top Bar */}
                <div className="sticky top-0 h-[60px] bg-surface border-b border-border-subtle z-30 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Hamburger toggle (mobile) - placeholder */}
                        <button className="md:hidden text-text-muted hover:text-text-primary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        {/* Breadcrumb / Title */}
                        <h1 className="text-lg font-semibold text-text-primary tracking-tight">Admin Dashboard</h1>
                    </div>

                    {/* Global Search Bar */}
                    <div className="hidden md:flex items-center bg-main border border-border-subtle rounded-full px-4 py-1.5 w-[400px]">
                        <svg className="w-4 h-4 text-text-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search globally..."
                            className="bg-transparent border-none outline-none text-sm text-text-primary w-full placeholder-text-muted"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Active Tests Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-danger-soft rounded-full border border-border-subtle">
                            <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-danger uppercase tracking-wide">{activeTestsCount} Active</span>
                        </div>

                        {/* Theme Toggle Placeholder */}
                        <button className="text-text-muted hover:text-text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        </button>

                        {/* Notifications */}
                        <button className="relative text-text-muted hover:text-text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
                        </button>

                        {/* Admin Profile */}
                        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border-subtle cursor-pointer">
                            <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white font-medium text-xs">
                                    {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-[32px] max-w-[1200px] mx-auto w-full">
                        <Routes>
                            {/* Redirect root to /admin */}
                            <Route path="/" element={<Navigate to="/admin" replace />} />

                            {/* Static Routes */}
                            <Route path="/admin" element={<AdminHome />} />
                            <Route path="/admin/students" element={<AdminUsers />} />
                            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                            <Route path="/admin/questions" element={<QuestionManager />} />
                            <Route path="/admin/scheduling" element={<AdminTestSlots />} />
                            <Route path="/admin/tests" element={<AdminLiveTests />} />
                            <Route path="/admin/submissions" element={<AdminSubmissions />} />

                            {/* Dynamic Route for Skill/Level/SubLevel Questions */}
                            <Route path="/admin/:skill/:level/:subLevel/questions" element={<DynamicQuestions />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </div>
    );
}
