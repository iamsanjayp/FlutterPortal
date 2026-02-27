import { useState, useEffect, useCallback } from "react";
import {
    Users, Clock, XCircle, Plus, AlertTriangle, CheckCircle, RefreshCw,
    ChevronLeft, Eye, Timer
} from "lucide-react";
import { fetchSlotStudents, revokeStudent, extendStudentTime } from "../../api/staffApi";

export default function SlotMonitor({ scheduleId, scheduleName, onBack }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const loadStudents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchSlotStudents(scheduleId);
            setStudents(res.students || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [scheduleId]);

    useEffect(() => {
        loadStudents();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadStudents, 30000);
        return () => clearInterval(interval);
    }, [loadStudents]);

    async function handleRevoke(sessionId, studentName) {
        if (!window.confirm(`Revoke access for ${studentName}? Their session will be marked as FAIL.`)) return;
        try {
            await revokeStudent(scheduleId, sessionId);
            showToast(`Revoked access for ${studentName}`);
            await loadStudents();
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    async function handleExtend(sessionId, studentName) {
        const minutes = prompt(`Extra minutes to add for ${studentName}:`, "15");
        if (!minutes) return;
        try {
            await extendStudentTime(scheduleId, sessionId, Number(minutes));
            showToast(`Extended ${studentName}'s time by ${minutes} minutes`);
            await loadStudents();
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    const inProgress = students.filter(s => s.status === "IN_PROGRESS");
    const completed = students.filter(s => s.status !== "IN_PROGRESS");

    function getTimeRemaining(s) {
        if (s.status !== "IN_PROGRESS" || !s.started_at || !s.duration_minutes) return null;
        const start = new Date(s.started_at).getTime();
        const end = start + (s.duration_minutes * 60 * 1000);
        const remaining = end - Date.now();
        if (remaining <= 0) return "Time's up";
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        return `${mins}m ${secs}s`;
    }

    const statusConfig = {
        IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "In Progress", dot: "bg-blue-500" },
        PASS: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Passed", dot: "bg-emerald-500" },
        FAIL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Failed", dot: "bg-red-500" },
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                {onBack && (
                    <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-800">{scheduleName || "Slot Monitor"}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Live student monitoring for this exam slot</p>
                </div>
                <button onClick={loadStudents} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <p className="text-[10px] font-bold text-blue-500 uppercase">In Progress</p>
                    <p className="text-2xl font-bold text-blue-700">{inProgress.length}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">Passed</p>
                    <p className="text-2xl font-bold text-emerald-700">{students.filter(s => s.status === "PASS").length}</p>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <p className="text-[10px] font-bold text-red-500 uppercase">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{students.filter(s => s.status === "FAIL").length}</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}

            {/* Active Students */}
            {inProgress.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Active Students ({inProgress.length})
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Student</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Roll No</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Level</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Time Left</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Submissions</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {inProgress.map(s => {
                                    const timeLeft = getTimeRemaining(s);
                                    const isLowTime = timeLeft && !timeLeft.includes("Time") && parseInt(timeLeft) < 10;
                                    return (
                                        <tr key={s.session_id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{s.full_name}</div>
                                                <div className="text-xs text-gray-400">{s.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{s.roll_no || s.enrollment_no || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{s.level}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-bold flex items-center gap-1 ${isLowTime ? "text-red-600" : "text-gray-600"}`}>
                                                    <Timer className="w-3 h-3" /> {timeLeft || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">{s.submission_count}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleExtend(s.session_id, s.full_name)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors border border-blue-200"
                                                    >
                                                        <Plus className="w-3 h-3" /> Time
                                                    </button>
                                                    <button
                                                        onClick={() => handleRevoke(s.session_id, s.full_name)}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors border border-red-200"
                                                    >
                                                        <XCircle className="w-3 h-3" /> Revoke
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Completed Students */}
            {completed.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                        Completed ({completed.length})
                    </h2>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Student</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Roll No</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Level</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500">Submissions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {completed.map(s => {
                                    const cfg = statusConfig[s.status] || statusConfig.FAIL;
                                    return (
                                        <tr key={s.session_id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-700">{s.full_name}</div>
                                                <div className="text-xs text-gray-400">{s.email}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{s.roll_no || s.enrollment_no || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{s.level}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${cfg.bg} ${cfg.text} ${cfg.border} border flex items-center gap-1 w-fit`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">{s.submission_count}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {students.length === 0 && !loading && !error && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No students in this slot yet</p>
                </div>
            )}
        </div>
    );
}
