import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, BookOpen, Layers, FileText, BarChart2, LogOut,
    Monitor, Gavel, Calendar, ChevronRight, Menu, X
} from 'lucide-react';
import QuestionPool from './QuestionPool';
import Analytics from './Analytics';
import SlotMonitor from './SlotMonitor';
import AdminSubmissions from '../admin/AdminSubmissions';
import QuestionManager from '../admin/QuestionManager';
import staffApi, { fetchMyAssignments } from '../../api/staffApi';

export default function StaffLayout({ user, onLogout }) {
    const [activePage, setActivePage] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [permissions, setPermissions] = useState({ can_manage_questions: 0 });
    const [loadingPerms, setLoadingPerms] = useState(true);

    // Slot monitor state
    const [monitoringSlot, setMonitoringSlot] = useState(null);

    useEffect(() => {
        loadAssignments();
    }, []);

    async function loadAssignments() {
        try {
            setLoadingPerms(true);
            const res = await fetchMyAssignments();
            setAssignments(res.assignments || []);
            setPermissions(res.permissions || { can_manage_questions: 0 });
        } catch (err) {
            console.error("Failed to load assignments:", err);
        } finally {
            setLoadingPerms(false);
        }
    }

    const hasGraderSlots = assignments.some(a => a.task_type === 'GRADER');
    const hasSupervisorSlots = assignments.some(a => a.task_type === 'SLOT_SUPERVISOR');
    const canManageQuestions = !!permissions.can_manage_questions;

    const graderSlots = assignments.filter(a => a.task_type === 'GRADER');
    const supervisorSlots = assignments.filter(a => a.task_type === 'SLOT_SUPERVISOR');

    // Dynamic pages based on role
    const pages = useMemo(() => {
        const list = [
            { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        ];
        if (canManageQuestions) {
            list.push({ key: "questions", label: "Questions", icon: BookOpen });
        }
        if (hasGraderSlots) {
            list.push({ key: "grading", label: "Grading", icon: Gavel });
        }
        if (hasSupervisorSlots) {
            list.push({ key: "slots", label: "My Slots", icon: Monitor });
        }
        list.push({ key: "question-pool", label: "Question Pool", icon: Layers });
        list.push({ key: "analytics", label: "Analytics", icon: BarChart2 });
        return list;
    }, [canManageQuestions, hasGraderSlots, hasSupervisorSlots]);

    // Render content
    function renderContent() {
        if (monitoringSlot) {
            return (
                <SlotMonitor
                    scheduleId={monitoringSlot.schedule_id}
                    scheduleName={monitoringSlot.schedule_name}
                    onBack={() => setMonitoringSlot(null)}
                />
            );
        }

        switch (activePage) {
            case "dashboard":
                return <StaffDashboardHome
                    assignments={assignments}
                    permissions={permissions}
                    loading={loadingPerms}
                    onOpenSlot={slot => { setMonitoringSlot(slot); }}
                    onNavigate={setActivePage}
                />;
            case "questions":
                return canManageQuestions ? <QuestionManager /> : <NoAccess />;
            case "grading":
                return hasGraderSlots ? <AdminSubmissions useRN useStaffApi staffApi={staffApi} /> : <NoAccess />;
            case "slots":
                return (
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">My Supervisor Slots</h2>
                        {supervisorSlots.length === 0 ? (
                            <p className="text-gray-500">No slots assigned</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {supervisorSlots.map(slot => (
                                    <div key={`${slot.schedule_id}-sup`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{slot.schedule_name}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(slot.start_at).toLocaleDateString()} – {new Date(slot.end_at).toLocaleDateString()}
                                                </div>
                                                <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded ${slot.schedule_active ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-400"}`}>
                                                    {slot.schedule_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setMonitoringSlot(slot)}
                                                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                                            >
                                                <Monitor className="w-3.5 h-3.5" /> Monitor
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case "question-pool":
                return <QuestionPool />;
            case "analytics":
                return <Analytics />;
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-main text-text-primary flex">
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-[240px] bg-sidebar border-r border-border-subtle z-50 shadow-sm transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                {/* Sidebar Header / Logo */}
                <div className="h-[60px] flex items-center px-6 border-b border-border-subtle shrink-0">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-gradient-to-br from-success to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">ST</span>
                        </div>
                        <h1 className="text-lg font-semibold text-text-primary tracking-tight truncate">Staff Portal</h1>
                        {/* Mobile close button */}
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-text-muted hover:text-text-primary">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
                    {/* Optional section label */}
                    <div className="px-3 py-2 mb-1">
                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Navigation</p>
                    </div>
                    {pages.map(page => {
                        const Icon = page.icon;
                        const isActive = activePage === page.key && !monitoringSlot;
                        return (
                            <button
                                key={page.key}
                                onClick={() => { setActivePage(page.key); setMonitoringSlot(null); }}
                                className={`w-full flex items-center gap-3 px-3 py-0 h-[44px] rounded-lg transition-all text-sm ${isActive
                                    ? 'bg-success-soft text-success font-medium border-l-[3px] border-l-success'
                                    : 'text-text-muted border-l-[3px] border-l-transparent hover:bg-surface hover:text-text-primary'
                                    }`}
                            >
                                <Icon className="w-[18px] h-[18px]" />
                                <span>{page.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Roles Summary */}
                <div className="p-3 border-t border-border-subtle">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">Roles</p>
                    <div className="space-y-1">
                        {canManageQuestions && (
                            <div className="flex items-center gap-2 px-3 h-[44px] bg-accent-soft rounded-lg text-xs font-medium text-accent">
                                <BookOpen className="w-[18px] h-[18px]" /> Qns Manager
                            </div>
                        )}
                        {hasGraderSlots && (
                            <div className="flex items-center gap-2 px-3 h-[44px] bg-indigo-500/10 rounded-lg text-xs font-medium text-indigo-400">
                                <Gavel className="w-[18px] h-[18px]" /> Grader ({graderSlots.length})
                            </div>
                        )}
                        {hasSupervisorSlots && (
                            <div className="flex items-center gap-2 px-3 h-[44px] bg-success-soft rounded-lg text-xs font-medium text-success">
                                <Monitor className="w-[18px] h-[18px]" /> Supervisor ({supervisorSlots.length})
                            </div>
                        )}
                    </div>
                </div>

                {/* User Profile Pinned Bottom */}
                <div className="p-3 border-t border-border-subtle">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 h-[44px] rounded-lg text-text-muted hover:bg-danger-soft hover:text-danger transition-all text-sm"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        <span className="font-medium">Logout</span>
                    </button>
                    <div className="flex items-center gap-3 mt-2 px-3 h-[44px]">
                        <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center border border-border-subtle shrink-0">
                            <span className="text-text-primary font-medium text-xs">
                                {user?.full_name?.charAt(0).toUpperCase() || 'S'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{user?.full_name || 'Staff Member'}</p>
                            <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
                {/* Top Bar */}
                <div className="sticky top-0 h-[60px] bg-surface border-b border-border-subtle z-30 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden text-text-muted hover:text-text-primary transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-text-primary tracking-tight">Staff Area</h1>
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
                        <button className="text-text-muted hover:text-text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        </button>
                        <button className="relative text-text-muted hover:text-text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full"></span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-[32px] max-w-[1200px] mx-auto w-full">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Home Dashboard ──
function StaffDashboardHome({ assignments, permissions, loading, onOpenSlot, onNavigate }) {
    const graderSlots = assignments.filter(a => a.task_type === 'GRADER');
    const supervisorSlots = assignments.filter(a => a.task_type === 'SLOT_SUPERVISOR');

    return (
        <div className="space-y-[24px]">
            <div>
                <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Welcome back!</h1>
                <p className="text-sm text-text-muted mt-1">Here's an overview of your assignments and tasks.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-success border-t-transparent" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface p-[24px] rounded-[10px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-[48px] h-[48px] bg-accent-soft rounded-[10px] flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-accent" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted mb-1">Question Access</p>
                                <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight">{permissions.can_manage_questions ? "Enabled" : "Disabled"}</p>
                            </div>
                            {permissions.can_manage_questions && (
                                <button onClick={() => onNavigate("questions")} className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1 mt-4 hover:underline">
                                    Open Questions <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <div className="bg-surface p-[24px] rounded-[10px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-[48px] h-[48px] bg-warning-soft rounded-[10px] flex items-center justify-center">
                                    <Gavel className="w-6 h-6 text-warning" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted mb-1">Grading Slots</p>
                                <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight">{graderSlots.length}</p>
                            </div>
                            {graderSlots.length > 0 && (
                                <button onClick={() => onNavigate("grading")} className="text-[11px] font-bold text-warning uppercase tracking-wider flex items-center gap-1 mt-4 hover:underline">
                                    Open Grading <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <div className="bg-surface p-[24px] rounded-[10px] border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-[48px] h-[48px] bg-success-soft rounded-[10px] flex items-center justify-center">
                                    <Monitor className="w-6 h-6 text-success" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-muted mb-1">Supervisor Slots</p>
                                <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight">{supervisorSlots.length}</p>
                            </div>
                            {supervisorSlots.length > 0 && (
                                <button onClick={() => onNavigate("slots")} className="text-[11px] font-bold text-success uppercase tracking-wider flex items-center gap-1 mt-4 hover:underline">
                                    View Slots <ChevronRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Assignments */}
                    {assignments.length > 0 && (
                        <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden mt-[24px]">
                            <div className="p-6 border-b border-border-subtle bg-main">
                                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">All Assignments</h3>
                            </div>
                            <div className="divide-y divide-border-subtle">
                                {assignments.map((a, i) => {
                                    const isGrader = a.task_type === 'GRADER';
                                    return (
                                        <div key={i} className="bg-surface px-6 py-4 flex items-center justify-between hover:bg-main hover:bg-opacity-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 border border-border-subtle ${isGrader ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>
                                                    {isGrader ? <Gavel className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-text-primary truncate">{a.schedule_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isGrader ? "bg-warning-soft text-warning outline outline-1 outline-warning/20" : "bg-success-soft text-success outline outline-1 outline-success/20"}`}>
                                                            {isGrader ? "Grader" : "Supervisor"}
                                                        </span>
                                                        <span className="text-text-muted text-[10px]">•</span>
                                                        <span className="text-text-muted text-[11px] truncate whitespace-nowrap">
                                                            {new Date(a.start_at).toLocaleDateString()} – {new Date(a.end_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {a.task_type === 'SLOT_SUPERVISOR' && (
                                                <button
                                                    onClick={() => onOpenSlot(a)}
                                                    className="px-4 h-[32px] bg-success-soft text-success rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-success hover:text-white transition-colors"
                                                >
                                                    Monitor
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {assignments.length === 0 && !permissions.can_manage_questions && (
                        <div className="text-center py-16 bg-surface rounded-[10px] border border-dashed border-border-subtle mt-[24px]">
                            <Calendar className="w-12 h-12 text-border-subtle mx-auto mb-4" />
                            <p className="text-base font-medium text-text-primary">No assignments yet</p>
                            <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">Ask your admin to assign you to slots or grant permissions to view this content.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function NoAccess() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center p-[32px] max-w-sm">
                <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-8 h-8 text-danger" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Access Denied</h3>
                <p className="text-sm text-text-muted">You do not have the required permissions to view this section. Please contact your administrator.</p>
            </div>
        </div>
    );
}