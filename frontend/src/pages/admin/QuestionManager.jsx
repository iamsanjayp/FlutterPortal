import { useState, useEffect } from "react";
import {
    Plus, Search, Edit2, Trash2, Eye, EyeOff, ChevronRight, Upload,
    FileCode, CheckCircle, XCircle, Image, BookOpen, Filter, X
} from "lucide-react";
import {
    fetchProblems,
    createProblem,
    updateProblem,
    deleteProblem,
    fetchTestCases,
    createTestCase,
    updateTestCase,
    deleteTestCase,
} from "../../api/adminApi";

const LEVELS = ["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B", "4C"];
const TYPES = [
    { value: "CODE", label: "Code", icon: FileCode, color: "emerald" },
    { value: "UI", label: "UI Design", icon: Image, color: "purple" },
];

const DEFAULT_FORM = {
    title: "",
    description: "",
    level: "3A",
    problemType: "CODE",
    language: "REACT_NATIVE", // or "JS"
    starterCode: `import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
});`,
    isActive: true,
    sampleImageBase64: "",
    uiRequiredWidgetsString: '[]',
};

export default function QuestionManager() {
    // Data
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterLevel, setFilterLevel] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterPlatform, setFilterPlatform] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    // Selection & Form
    const [selectedId, setSelectedId] = useState(null);
    const [formMode, setFormMode] = useState("idle"); // 'idle' | 'create' | 'edit'
    const [form, setForm] = useState({ ...DEFAULT_FORM });

    // Test Cases
    const [testCases, setTestCases] = useState([]);
    const [tcForm, setTcForm] = useState({ input: "", expectedOutput: "", isHidden: false, orderNo: 1 });
    const [tcLoading, setTcLoading] = useState(false);

    // Notifications
    const [toast, setToast] = useState(null);

    // Detail tab
    const [detailTab, setDetailTab] = useState("details"); // 'details' | 'testcases'

    // ------- Load -------
    useEffect(() => { loadProblems(); }, []);

    async function loadProblems() {
        setLoading(true);
        try {
            // Fetch all problems (no language filter, allows managing both JS & RN)
            const res = await fetchProblems({});
            setProblems(res.problems || []);
        } catch {
            showToast("Failed to fetch problems", "error");
        } finally {
            setLoading(false);
        }
    }

    async function loadTestCases(problemId) {
        setTcLoading(true);
        try {
            const res = await fetchTestCases(problemId);
            setTestCases(res.testCases || []);
        } catch {
            setTestCases([]);
        } finally {
            setTcLoading(false);
        }
    }

    // ------- Selection -------
    function handleSelect(problem) {
        setSelectedId(problem.id);
        setFormMode("edit");
        setForm({
            title: problem.title || "",
            description: problem.description || "",
            level: problem.level || "3A",
            problemType: problem.problem_type || "CODE",
            starterCode: problem.starter_code || "",
            isActive: problem.is_active ?? true,
            language: problem.language || "REACT_NATIVE",
            sampleImageBase64: problem.sample_image_base64 || "",
            uiRequiredWidgetsString: problem.ui_required_widgets ? JSON.stringify(problem.ui_required_widgets, null, 2) : '[]',
        });
        loadTestCases(problem.id);
        setDetailTab("details");
    }

    function handleCreate() {
        setSelectedId(null);
        setFormMode("create");
        setForm({ ...DEFAULT_FORM });
        setTestCases([]);
        setDetailTab("details");
    }

    // ------- Save / Update / Delete -------
    async function handleSave() {
        if (!form.title.trim()) { showToast("Title is required", "error"); return; }

        // Validate CODE requirements natively
        if (form.problemType === 'CODE') {
            const publicCount = testCases.filter(tc => !tc.is_hidden).length;
            const hiddenCount = testCases.filter(tc => tc.is_hidden).length;

            // Optional structural check. Disabling hard stop for now to allow saving drafts.
            if (formMode === 'edit' && (publicCount !== 2 || hiddenCount !== 5) && form.language === 'REACT_NATIVE') {
                showToast(`Warning: RN CODE problems usually require 2 sample and 5 hidden test cases. (${publicCount} pub, ${hiddenCount} hid)`, "error");
            }
        }

        try {
            let uiRequiredWidgets = null;
            if (form.problemType === 'UI' && form.language === 'REACT_NATIVE') {
                try {
                    uiRequiredWidgets = JSON.parse(form.uiRequiredWidgetsString);
                } catch {
                    showToast("Invalid JSON in Required Widgets", "error");
                    return;
                }
            }

            const payload = {
                title: form.title,
                description: form.description,
                level: form.level,
                problemType: form.problemType,
                starterCode: form.starterCode,
                isActive: form.isActive,
                language: form.language,
                sampleImageBase64: form.sampleImageBase64 || null,
                uiRequiredWidgets
            };

            if (formMode === "create") {
                await createProblem(payload);
                showToast("Problem created successfully!");
                const refreshed = await fetchProblems({});
                setProblems(refreshed.problems || []);
                const newProblem = (refreshed.problems || []).find(p => p.title === form.title);
                if (newProblem) {
                    setSelectedId(newProblem.id);
                    setFormMode("edit");
                    loadTestCases(newProblem.id);
                }
            } else {
                await updateProblem(selectedId, payload);
                showToast("Problem updated successfully!");
                await loadProblems();
            }
        } catch (err) {
            showToast(err.message || "Failed to save", "error");
        }
    }

    // Platform/Type changed -> Update starter block
    function handleLanguageTypeChange(lang, type) {
        let newStarterCode = "";
        if (lang === 'JS') {
            newStarterCode = `function solution() {\n  // Write your code here\n  return null;\n}`;
            type = 'CODE'; // JS problems are always CODE
        } else if (lang === 'REACT_NATIVE') {
            if (type === 'CODE') {
                newStarterCode = `function solution() {\n  // Write your code here\n  return null;\n}`;
            } else {
                newStarterCode = `import React from 'react';\nimport { View, Text, StyleSheet } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={styles.container}>\n      <Text>UI Design</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }\n});`;
            }
        }

        setForm({ ...form, language: lang, problemType: type, starterCode: newStarterCode });
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this problem? This cannot be undone.")) return;
        try {
            await deleteProblem(id);
            showToast("Problem deleted");
            if (selectedId === id) {
                setSelectedId(null);
                setFormMode("idle");
            }
            await loadProblems();
        } catch (err) {
            showToast(err.message || "Failed to delete", "error");
        }
    }

    // ------- Test Case CRUD -------
    async function handleAddTestCase() {
        if (!selectedId) return;
        try {
            await createTestCase(selectedId, tcForm);
            setTcForm({ input: "", expectedOutput: "", isHidden: false, orderNo: tcForm.orderNo + 1 });
            await loadTestCases(selectedId);
            showToast("Test case added");
        } catch (err) {
            showToast(err.message || "Failed to add test case", "error");
        }
    }

    async function handleToggleTestCase(tc) {
        try {
            await updateTestCase(tc.id, {
                input: tc.input,
                expectedOutput: tc.expected_output,
                isHidden: !tc.is_hidden,
                orderNo: tc.order_no,
            });
            await loadTestCases(selectedId);
        } catch {
            showToast("Failed to update", "error");
        }
    }

    async function handleDeleteTestCase(tcId) {
        try {
            await deleteTestCase(tcId);
            await loadTestCases(selectedId);
            showToast("Test case deleted");
        } catch {
            showToast("Failed to delete test case", "error");
        }
    }

    // ------- Image Upload -------
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast("Image must be under 2MB", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            setForm(prev => ({ ...prev, sampleImageBase64: base64 }));
        };
        reader.readAsDataURL(file);
    }

    // ------- Toast -------
    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    // ------- Filtered Problems -------
    const filtered = problems.filter(p => {
        if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterLevel !== "all" && p.level !== filterLevel) return false;
        if (filterType !== "all" && p.problem_type !== filterType) return false;
        if (filterPlatform !== "all" && p.language !== filterPlatform) return false;
        if (filterStatus === "active" && !p.is_active) return false;
        if (filterStatus === "inactive" && p.is_active) return false;
        return true;
    });

    const sampleCount = testCases.filter(tc => !tc.is_hidden).length;
    const hiddenCount = testCases.filter(tc => tc.is_hidden).length;

    // ======================== RENDER ========================
    return (
        <div className="flex flex-col h-[calc(100vh-[100px])] gap-[24px]">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-bold tracking-wider uppercase animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-danger text-white" : "bg-success text-white"}`}>
                    {toast.type === "error" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 mb-2">
                <div>
                    <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Question Manager</h1>
                    <p className="text-sm text-text-muted mt-1">Manage coding problems, test cases & assets</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-accent text-white h-[40px] px-6 rounded-[8px] hover:bg-accent/90 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider"
                >
                    <Plus className="w-4 h-4" />
                    New Problem
                </button>
            </div>

            {/* Main Grid */}
            <div className="flex-1 flex gap-[24px] min-h-0">

                {/* ====== LEFT: Question List ====== */}
                <div className="w-[380px] shrink-0 flex flex-col bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-border-subtle bg-main">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search problems..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border-subtle rounded-[8px] focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-text-primary placeholder:text-text-muted transition-colors"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-border-subtle flex flex-wrap gap-2 bg-surface">
                        <select
                            value={filterLevel}
                            onChange={e => setFilterLevel(e.target.value)}
                            className="text-xs px-2 py-1.5 bg-main border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-text-primary h-[32px]"
                        >
                            <option value="all">All Levels</option>
                            {LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                        </select>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="text-xs px-2 py-1.5 bg-main border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-text-primary h-[32px]"
                        >
                            <option value="all">All Types</option>
                            <option value="CODE">Code</option>
                            <option value="UI">UI Design</option>
                        </select>
                        <select
                            value={filterPlatform}
                            onChange={e => setFilterPlatform(e.target.value)}
                            className="text-xs px-2 py-1.5 bg-main border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-text-primary h-[32px]"
                        >
                            <option value="all">Platforms</option>
                            <option value="JS">Standard JS</option>
                            <option value="REACT_NATIVE">React Native</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="text-xs px-2 py-1.5 bg-main border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-text-primary h-[32px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div className="ml-auto flex items-center">
                            <span className="text-[10px] font-bold text-text-muted bg-main px-2 py-1 rounded-full border border-border-subtle">
                                {filtered.length} / {problems.length}
                            </span>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-main">
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-12 text-text-muted text-sm font-medium">
                                {problems.length === 0 ? "No problems yet" : "No matches found"}
                            </div>
                        ) : (
                            filtered.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => handleSelect(p)}
                                    className={`px-5 py-4 border-b border-border-subtle cursor-pointer transition-all group ${selectedId === p.id
                                        ? "bg-accent-soft border-l-[3px] border-l-accent text-accent"
                                        : "hover:bg-gray-50 border-l-[3px] border-l-transparent"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-medium truncate ${selectedId === p.id ? "text-blue-700" : "text-gray-800"}`}>
                                                {p.title}
                                            </h4>
                                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    {p.level}
                                                </span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.language === "JS"
                                                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                                                    : "bg-blue-50 text-blue-600 border border-blue-100"
                                                    }`}>
                                                    {p.language === "JS" ? "JS Mode" : "RN Mode"}
                                                </span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.problem_type === "CODE"
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                    : "bg-purple-50 text-purple-600 border border-purple-100"
                                                    }`}>
                                                    {p.problem_type}
                                                </span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.is_active
                                                    ? "bg-green-50 text-green-600 border border-green-100"
                                                    : "bg-gray-100 text-gray-400"
                                                    }`}>
                                                    {p.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ====== RIGHT: Detail Panel ====== */}
                <div className="flex-1 flex flex-col bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden min-w-0">
                    {formMode === "idle" ? (
                        <div className="flex-1 flex items-center justify-center text-center">
                            <div>
                                <div className="w-16 h-16 bg-main rounded-[16px] flex items-center justify-center mx-auto mb-4 border border-border-subtle shadow-sm">
                                    <BookOpen className="w-7 h-7 text-text-muted" />
                                </div>
                                <h3 className="text-lg font-semibold text-text-primary tracking-tight">Select a Problem</h3>
                                <p className="text-sm text-text-muted mt-1">Choose from the list or create a new one</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Detail Tabs */}
                            <div className="flex items-center border-b border-border-subtle px-4 bg-main h-[52px] shrink-0">
                                <button
                                    onClick={() => setDetailTab("details")}
                                    className={`px-4 h-full text-sm font-bold uppercase tracking-wider border-b-[3px] transition-colors ${detailTab === "details"
                                        ? "border-accent text-accent"
                                        : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    Problem Details
                                </button>
                                <button
                                    onClick={() => setDetailTab("testcases")}
                                    className={`px-4 h-full text-sm font-bold uppercase tracking-wider border-b-[3px] transition-colors ${detailTab === "testcases"
                                        ? "border-accent text-accent"
                                        : "border-transparent text-text-muted hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    {form.problemType === "CODE" ? "Test Cases" : "Assets"}
                                    {form.problemType === "CODE" && testCases.length > 0 && (
                                        <span className="ml-1.5 text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded-full font-bold">
                                            {testCases.length}
                                        </span>
                                    )}
                                </button>

                                <div className="ml-auto flex items-center gap-2">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${formMode === "create" ? "bg-success-soft text-success border border-success/20" : "bg-warning-soft text-warning border border-warning/20"
                                        }`}>
                                        {formMode === "create" ? "Creating New" : `Editing #${selectedId}`}
                                    </span>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-[32px] custom-scrollbar bg-main">
                                {/* ---- Details Tab ---- */}
                                {detailTab === "details" && (
                                    <div className="space-y-[24px] max-w-3xl">
                                        {/* Title */}
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Title</label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={e => setForm({ ...form, title: e.target.value })}
                                                className="w-full h-[40px] px-4 bg-surface border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm text-text-primary placeholder:text-text-muted transition-colors"
                                                placeholder="e.g. Build a Simple Counter App"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Description</label>
                                            <textarea
                                                value={form.description}
                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                                rows={5}
                                                className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm font-mono text-text-primary placeholder:text-text-muted transition-colors resize-y"
                                                placeholder="Problem description (Markdown supported)..."
                                            />
                                        </div>

                                        {/* Row: Level + Platform + Type + Active */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Level</label>
                                                <select
                                                    value={form.level}
                                                    onChange={e => setForm({ ...form, level: e.target.value })}
                                                    className="w-full h-[40px] px-3 bg-surface border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm text-text-primary"
                                                >
                                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Platform</label>
                                                <select
                                                    value={form.language}
                                                    onChange={e => handleLanguageTypeChange(e.target.value, form.problemType)}
                                                    className="w-full h-[40px] px-3 bg-surface border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm text-text-primary"
                                                >
                                                    <option value="REACT_NATIVE">React Native</option>
                                                    <option value="JS">Standard JS</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Problem Type</label>
                                                <select
                                                    value={form.problemType}
                                                    onChange={e => handleLanguageTypeChange(form.language, e.target.value)}
                                                    className="w-full h-[40px] px-3 bg-surface border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm text-text-primary disabled:opacity-50 disabled:bg-main transition-colors"
                                                    disabled={form.language === "JS"}
                                                >
                                                    <option value="CODE">Code (Algorithms)</option>
                                                    <option value="UI">UI (Design)</option>
                                                </select>
                                                {form.language === "JS" && <span className="text-[10px] text-text-muted mt-1 block">JS problems must be CODE type.</span>}
                                            </div>
                                            <div className="flex items-end pb-1">
                                                <label className="flex items-center gap-2 cursor-pointer h-[40px]">
                                                    <input
                                                        type="checkbox"
                                                        checked={form.isActive}
                                                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                                        className="w-4 h-4 text-accent border-border-subtle rounded focus:ring-accent bg-surface"
                                                    />
                                                    <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Active</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Starter Code */}
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Starter Code</label>
                                            <textarea
                                                value={form.starterCode}
                                                onChange={e => setForm({ ...form, starterCode: e.target.value })}
                                                rows={12}
                                                className="w-full px-4 py-3 bg-main border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm font-mono text-text-primary placeholder:text-text-muted transition-colors resize-y"
                                                placeholder="Starter code for the student..."
                                            />
                                        </div>

                                        {/* UI Required Widgets (Only for RN UI Problems) */}
                                        {form.problemType === 'UI' && form.language === 'REACT_NATIVE' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Required Widgets (JSON)</label>
                                                    <span className="text-[10px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20">
                                                        Auto-grader Reference
                                                    </span>
                                                </div>
                                                <textarea
                                                    value={form.uiRequiredWidgetsString}
                                                    onChange={event => setForm({ ...form, uiRequiredWidgetsString: event.target.value })}
                                                    className="w-full px-4 py-3 bg-main border border-border-subtle rounded-[8px] focus:ring-1 focus:ring-accent focus:border-accent text-sm font-mono text-text-primary placeholder:text-text-muted transition-colors resize-y"
                                                    placeholder='[{"type": "Text", "text": "Hello"}, {"type": "Button"}]'
                                                    rows={4}
                                                />
                                            </div>
                                        )}

                                        {/* Buttons */}
                                        <div className="flex gap-[12px] pt-[8px]">
                                            <button
                                                onClick={handleSave}
                                                className="h-[40px] px-6 bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors text-xs font-bold uppercase tracking-wider shadow-sm"
                                            >
                                                {formMode === "create" ? "Create Problem" : "Save Changes"}
                                            </button>
                                            <button
                                                onClick={() => { setFormMode("idle"); setSelectedId(null); }}
                                                className="h-[40px] px-6 bg-surface border border-border-subtle text-text-primary rounded-[8px] hover:bg-main transition-colors text-xs font-bold uppercase tracking-wider"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ---- Test Cases / Assets Tab ---- */}
                                {detailTab === "testcases" && (
                                    <div className="max-w-3xl">
                                        {form.problemType === "CODE" ? (
                                            <>
                                                {/* Stats Banner */}
                                                <div className="bg-main border border-border-subtle rounded-[10px] p-[16px] mb-[24px]">
                                                    <p className="text-sm text-text-primary leading-relaxed">
                                                        <strong className="text-accent">Recommended:</strong> 2 sample (public) + 5 hidden test cases
                                                        <br />
                                                        <strong className="text-text-muted">Current:</strong>{" "}
                                                        <span className="font-bold text-success">{sampleCount} public</span>,{" "}
                                                        <span className="font-bold text-warning">{hiddenCount} hidden</span>
                                                    </p>
                                                </div>

                                                {formMode === "create" ? (
                                                    <div className="text-center py-[48px] bg-main rounded-[10px] border border-dashed border-border-subtle">
                                                        <p className="text-text-muted text-sm font-medium">Save the problem first to add test cases</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Add Test Case */}
                                                        <div className="bg-surface rounded-[10px] border border-border-subtle p-[24px] mb-[24px] shadow-sm">
                                                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-[16px]">Add New Test Case</h4>
                                                            <div className="space-y-[16px]">
                                                                <input
                                                                    value={tcForm.input}
                                                                    onChange={e => setTcForm({ ...tcForm, input: e.target.value })}
                                                                    className="w-full h-[40px] px-3 bg-surface border border-border-subtle rounded-[8px] text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                                                                    placeholder="Input (e.g., props or state)"
                                                                />
                                                                <input
                                                                    value={tcForm.expectedOutput}
                                                                    onChange={e => setTcForm({ ...tcForm, expectedOutput: e.target.value })}
                                                                    className="w-full h-[40px] px-3 bg-surface border border-border-subtle rounded-[8px] text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                                                                    placeholder="Expected output"
                                                                />
                                                                <div className="flex items-center gap-[16px]">
                                                                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider cursor-pointer h-[40px]">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={tcForm.isHidden}
                                                                            onChange={e => setTcForm({ ...tcForm, isHidden: e.target.checked })}
                                                                            className="rounded border-border-subtle text-accent focus:ring-accent bg-surface w-4 h-4"
                                                                        />
                                                                        Hidden
                                                                    </label>
                                                                    <div className="flex items-center gap-[8px]">
                                                                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Order:</span>
                                                                        <input
                                                                            type="number"
                                                                            value={tcForm.orderNo}
                                                                            onChange={e => setTcForm({ ...tcForm, orderNo: Number(e.target.value) })}
                                                                            className="w-[64px] h-[40px] px-3 border border-border-subtle bg-surface rounded-[8px] text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        onClick={handleAddTestCase}
                                                                        className="ml-auto h-[40px] px-6 bg-success text-white rounded-[8px] hover:bg-success/90 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Test Cases List */}
                                                        {tcLoading ? (
                                                            <div className="text-center py-[32px]">
                                                                <div className="animate-spin rounded-full h-[24px] w-[24px] border-2 border-accent border-t-transparent mx-auto" />
                                                            </div>
                                                        ) : testCases.length === 0 ? (
                                                            <div className="text-center py-[32px] text-text-muted text-sm font-medium">No test cases yet</div>
                                                        ) : (
                                                            <div className="space-y-[8px]">
                                                                {testCases.map(tc => (
                                                                    <div key={tc.id} className="flex items-start gap-[12px] p-[12px] border border-border-subtle rounded-[10px] bg-surface hover:border-accent/40 hover:shadow-sm transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="grid grid-cols-2 gap-[8px] text-xs">
                                                                                <div>
                                                                                    <span className="font-bold text-text-muted uppercase tracking-wider">Input:</span>
                                                                                    <div className="text-text-primary mt-[4px] font-mono truncate">{tc.input || "—"}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-bold text-text-muted uppercase tracking-wider">Expected:</span>
                                                                                    <div className="text-text-primary mt-[4px] font-mono truncate">{tc.expected_output || "—"}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-[8px] mt-[8px]">
                                                                                <span className={`text-[10px] font-bold px-[6px] py-[2px] rounded ${tc.is_hidden ? "bg-main text-text-muted" : "bg-success/10 text-success"}`}>
                                                                                    {tc.is_hidden ? "Hidden" : "Public"}
                                                                                </span>
                                                                                <span className="text-[10px] font-medium text-text-muted">Order: {tc.order_no}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-[4px] shrink-0">
                                                                            <button
                                                                                onClick={() => handleToggleTestCase(tc)}
                                                                                className="p-[6px] text-text-muted hover:text-accent hover:bg-accent/10 rounded-[6px] transition-colors"
                                                                                title="Toggle Visibility"
                                                                            >
                                                                                {tc.is_hidden ? <EyeOff className="w-[14px] h-[14px]" /> : <Eye className="w-[14px] h-[14px]" />}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteTestCase(tc.id)}
                                                                                className="p-[6px] text-text-muted hover:text-error hover:bg-error/10 rounded-[6px] transition-colors"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="w-[14px] h-[14px]" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            /* UI TYPE: Image Upload */
                                            <div>
                                                <div className="bg-warning/10 border border-warning/20 rounded-[10px] p-[16px] mb-[24px]">
                                                    <p className="text-sm text-warning leading-relaxed">
                                                        <strong>UI Problem Assets:</strong> Upload a reference image for the student to replicate.
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mb-[12px]">
                                                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">Sample Image</label>
                                                    {form.sampleImageBase64 && (
                                                        <button
                                                            onClick={() => setForm({ ...form, sampleImageBase64: "" })}
                                                            className="text-[10px] font-bold text-error uppercase tracking-wider hover:text-error/80 transition-colors"
                                                        >
                                                            Remove Image
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="border-2 border-dashed border-border-subtle rounded-[10px] p-[32px] flex flex-col items-center justify-center bg-main hover:bg-surface transition-colors relative cursor-pointer group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    {form.sampleImageBase64 ? (
                                                        <div className="text-center">
                                                            <img
                                                                src={`data:image/png;base64,${form.sampleImageBase64}`}
                                                                alt="Sample"
                                                                className="max-h-[256px] mx-auto rounded-[8px] shadow-sm border border-border-subtle"
                                                            />
                                                            <p className="mt-[12px] text-xs font-medium text-text-muted group-hover:text-accent transition-colors">Click to replace</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <Upload className="w-[40px] h-[40px] text-text-muted mx-auto mb-[12px] group-hover:text-accent transition-colors" />
                                                            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Click to upload or drag and drop</p>
                                                            <p className="text-xs text-text-muted mt-[4px]">PNG, JPG, GIF up to 2MB</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Save reminder */}
                                                <div className="mt-[16px]">
                                                    <button
                                                        onClick={handleSave}
                                                        className="h-[40px] px-6 bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors text-xs font-bold uppercase tracking-wider shadow-sm"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
