import { useState, useEffect } from "react";
import {
    Users, Shield, BookOpen, Eye, Search, CheckCircle, Plus, X,
    Gavel, Monitor, ChevronDown, ChevronUp, Calendar
} from "lucide-react";
import {
    fetchStaffList,
    setStaffPermissions,
    fetchSchedules,
    assignStaffToSchedule,
    getScheduleAssignments,
    removeStaffAssignment,
    createStaff
} from "../../api/adminApi";

export default function StaffManagement() {
    const [staff, setStaff] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [toast, setToast] = useState(null);

    // Assignment modal
    const [assignModal, setAssignModal] = useState(null); // { staffId, staffName }
    const [selectedSchedule, setSelectedSchedule] = useState("");
    const [selectedTaskType, setSelectedTaskType] = useState("SLOT_SUPERVISOR");

    // Create staff modal
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Expanded staff card
    const [expandedId, setExpandedId] = useState(null);
    const [assignments, setAssignments] = useState({}); // { scheduleId: [assignments] }

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [staffRes, schedRes] = await Promise.all([fetchStaffList(), fetchSchedules()]);
            setStaff(staffRes.staff || []);
            setSchedules(schedRes.schedules || []);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleQuestionPerm(s) {
        try {
            const newVal = !s.can_manage_questions;
            await setStaffPermissions(s.id, { canManageQuestions: newVal });
            setStaff(prev => prev.map(st => st.id === s.id ? { ...st, can_manage_questions: newVal ? 1 : 0 } : st));
            showToast(`Question management ${newVal ? "enabled" : "disabled"} for ${s.full_name}`);
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    async function handleAssign() {
        if (!assignModal || !selectedSchedule) return;
        try {
            await assignStaffToSchedule(selectedSchedule, {
                userIds: [assignModal.staffId],
                taskType: selectedTaskType,
            });
            showToast(`Assigned ${assignModal.staffName} as ${selectedTaskType === 'GRADER' ? 'Grader' : 'Slot Supervisor'}`);
            setAssignModal(null);
            await loadData();
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    async function handleRemoveAssignment(scheduleId, userId, taskType) {
        try {
            await removeStaffAssignment(scheduleId, userId + `?taskType=${taskType}`);
            showToast("Assignment removed");
            await loadData();
        } catch (err) {
            showToast(err.message, "error");
        }
    }

    async function loadStaffAssignments(staffId) {
        // Load all schedule assignments for viewing
        try {
            const allAssignments = [];
            for (const sch of schedules) {
                const res = await getScheduleAssignments(sch.id);
                const staffAssigns = (res.assignments || []).filter(a => a.id === staffId);
                if (staffAssigns.length > 0) {
                    allAssignments.push(...staffAssigns.map(a => ({ ...a, schedule_id: sch.id, schedule_name: sch.name, start_at: sch.start_at, end_at: sch.end_at })));
                }
            }
            setAssignments(prev => ({ ...prev, [staffId]: allAssignments }));
        } catch (err) {
            console.error(err);
        }
    }

    function toggleExpand(staffId) {
        if (expandedId === staffId) {
            setExpandedId(null);
        } else {
            setExpandedId(staffId);
            loadStaffAssignments(staffId);
        }
    }

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    const filtered = staff.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.staff_id?.toLowerCase().includes(q);
    });

    const TASK_TYPE_CONFIG = {
        GRADER: { label: "Grader", icon: Gavel, color: "indigo", desc: "Can grade student submissions" },
        SLOT_SUPERVISOR: { label: "Slot Supervisor", icon: Monitor, color: "emerald", desc: "Can monitor exam slots" },
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" /> Staff Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Assign staff to slots and manage permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Staff
                </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Question Manager</p>
                        <p className="text-[10px] text-gray-400">Add/edit/delete problems</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Gavel className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Grader</p>
                        <p className="text-[10px] text-gray-400">Grade submissions per slot</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Slot Supervisor</p>
                        <p className="text-[10px] text-gray-400">Monitor exams, revoke access</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search staff..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Staff Cards */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No staff members found</p>
                    <p className="text-xs text-gray-400 mt-1">Add users with the TEACHER role</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(s => (
                        <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                                        <span className="text-white font-bold text-sm">{s.full_name?.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">{s.full_name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{s.email}</span>
                                            {s.staff_id && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{s.staff_id}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Question Manager Toggle */}
                                    <button
                                        onClick={() => handleToggleQuestionPerm(s)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${s.can_manage_questions
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-gray-50 text-gray-400 border-gray-200"
                                            }`}
                                        title="Toggle question management permission"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Questions
                                    </button>

                                    {/* Assignment Count */}
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        {s.assignment_count} slots
                                    </span>

                                    {/* Assign Button */}
                                    <button
                                        onClick={() => setAssignModal({ staffId: s.id, staffName: s.full_name })}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Assign
                                    </button>

                                    {/* Expand */}
                                    <button
                                        onClick={() => toggleExpand(s.id)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        {expandedId === s.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded: Assignments */}
                            {expandedId === s.id && (
                                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                                    {!assignments[s.id] ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mx-auto" />
                                        </div>
                                    ) : assignments[s.id].length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-2">No slot assignments</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {assignments[s.id].map((a, i) => {
                                                const cfg = TASK_TYPE_CONFIG[a.task_type] || TASK_TYPE_CONFIG.SLOT_SUPERVISOR;
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={i} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center bg-${cfg.color}-50`}>
                                                                <Icon className={`w-3.5 h-3.5 text-${cfg.color}-600`} />
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-medium text-gray-700">{a.schedule_name}</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-${cfg.color}-50 text-${cfg.color}-600`}>
                                                                        {cfg.label}
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-400">
                                                                        {new Date(a.start_at).toLocaleDateString()} – {new Date(a.end_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(a.schedule_id, s.id, a.task_type)}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                            title="Remove assignment"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-800">Assign to Slot</h2>
                            <button onClick={() => setAssignModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Assign <strong className="text-gray-800">{assignModal.staffName}</strong> to a test slot:
                        </p>

                        {/* Schedule Picker */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Test Slot</label>
                            <select
                                value={selectedSchedule}
                                onChange={e => setSelectedSchedule(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a slot...</option>
                                {schedules.map(sch => (
                                    <option key={sch.id} value={sch.id}>
                                        {sch.name} ({new Date(sch.start_at).toLocaleDateString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Task Type */}
                        <div className="mb-5">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Role</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(TASK_TYPE_CONFIG).map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    const selected = selectedTaskType === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedTaskType(key)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${selected
                                                ? `border-${cfg.color}-500 bg-${cfg.color}-50`
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${selected ? `text-${cfg.color}-600` : "text-gray-400"}`} />
                                            <span className={`text-xs font-medium ${selected ? `text-${cfg.color}-700` : "text-gray-500"}`}>{cfg.label}</span>
                                            <span className="text-[9px] text-gray-400 text-center">{cfg.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAssign}
                                disabled={!selectedSchedule}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                Assign Staff
                            </button>
                            <button
                                onClick={() => setAssignModal(null)}
                                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Staff Modal */}
            {showCreateModal && (
                <CreateStaffModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); loadData(); }}
                />
            )}
        </div>
    );
}

function CreateStaffModal({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        age: "",
        department: "",
        experienceYears: "",
        staffId: ""
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createStaff(form);
            onSuccess();
        } catch (err) {
            setError(err.message || "Failed to create staff");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm custom-scrollbar overflow-y-auto pt-20 pb-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative my-auto">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Add Staff Member</h2>
                    <p className="text-sm text-gray-500 mt-1">If Experience {'>'} 2 years, they will automatically get Question Manager access.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                        <X className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                            <input
                                type="text" required name="fullName"
                                value={form.fullName} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                            <input
                                type="email" required name="email"
                                value={form.email} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password*</label>
                            <input
                                type="text" required name="password"
                                value={form.password} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g. welcome123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                            <input
                                type="text" name="staffId"
                                value={form.staffId} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g. STF-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input
                                type="number" name="age"
                                value={form.age} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g. 30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                            <input
                                type="number" name="experienceYears"
                                value={form.experienceYears} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g. 3"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <input
                                type="text" name="department"
                                value={form.department} onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g. Computer Science"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Add Staff"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
