import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Save, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';
import { fetchSkills, fetchLevels, fetchSubLevels } from '../../api/questionApi';
import { fetchPoolConfig, updatePoolConfig, previewPool } from '../../api/poolApi';

export default function QuestionPool() {
    // Selection state
    const [selectedSkill, setSelectedSkill] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedSubLevel, setSelectedSubLevel] = useState('');

    // Metadata options
    const [skills, setSkills] = useState([]);
    const [levels, setLevels] = useState([]);
    const [subLevels, setSubLevels] = useState([]);

    // Config state
    const [config, setConfig] = useState(null); // { questions_per_student, randomization_mode, ... }
    const [previewQuestions, setPreviewQuestions] = useState([]);

    // UI state
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Initial load
    useEffect(() => {
        loadSkills();
    }, []);

    // Load levels when skill changes
    useEffect(() => {
        if (selectedSkill) {
            loadLevels(selectedSkill);
            // Reset downstream
            setSelectedLevel('');
            setSelectedSubLevel('');
            setConfig(null);
            setPreviewQuestions([]);
        }
    }, [selectedSkill]);

    // Load sub-levels when level changes
    useEffect(() => {
        if (selectedSkill && selectedLevel) {
            loadSubLevels(selectedSkill, selectedLevel);
            // Reset downstream
            setSelectedSubLevel('');
            setConfig(null);
            setPreviewQuestions([]);
        }
    }, [selectedSkill, selectedLevel]);

    // Load config when all selected
    useEffect(() => {
        if (selectedSkill && selectedLevel && selectedSubLevel) {
            loadConfig();
        }
    }, [selectedSkill, selectedLevel, selectedSubLevel]);

    const loadSkills = async () => {
        try {
            const data = await fetchSkills();
            setSkills(data.skills || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadLevels = async (skill) => {
        try {
            const data = await fetchLevels(skill);
            setLevels(data.levels || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadSubLevels = async (skill, level) => {
        try {
            const data = await fetchSubLevels(skill, level);
            setSubLevels(data.sub_levels || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadConfig = async () => {
        setLoadingConfig(true);
        setError(null);
        try {
            const data = await fetchPoolConfig(selectedSkill, selectedLevel, selectedSubLevel);
            setConfig(data.config);
            // Auto-load preview
            loadPreview(data.config.questions_per_student);
        } catch (err) {
            setError("Failed to load configuration");
            console.error(err);
        } finally {
            setLoadingConfig(false);
        }
    };

    const loadPreview = async (count) => {
        setLoadingPreview(true);
        try {
            const data = await previewPool(selectedSkill, selectedLevel, selectedSubLevel, count);
            setPreviewQuestions(data.questions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await updatePoolConfig({
                skill: selectedSkill,
                levelNumber: selectedLevel,
                subLevel: selectedSubLevel,
                questionsPerStudent: config.questions_per_student,
                randomizationMode: config.randomization_mode,
                isActive: config.is_active
            });
            setSuccessMessage("Configuration saved successfully");
            setTimeout(() => setSuccessMessage(null), 3000);

            // Refresh preview with new count
            loadPreview(config.questions_per_student);
        } catch (err) {
            setError("Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleConfigChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Question Pool Control</h1>
            <p className="text-gray-500 mb-8">Configure randomization and question eligibility per sub-level</p>

            {/* Selection Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layers size={16} />
                    Select Scope
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
                        <select
                            value={selectedSkill}
                            onChange={(e) => setSelectedSkill(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Skill</option>
                            {skills.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                        <div className="flex gap-2">
                            {levels.map(l => (
                                <button
                                    key={l.level_number}
                                    onClick={() => setSelectedLevel(l.level_number)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedLevel === l.level_number
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {l.level_number}
                                </button>
                            ))}
                            {levels.length === 0 && <span className="text-gray-400 text-sm py-2">Select skill first</span>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub-level</label>
                        <div className="flex gap-2">
                            {subLevels.map(sl => (
                                <button
                                    key={sl.sub_level}
                                    onClick={() => setSelectedSubLevel(sl.sub_level)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedSubLevel === sl.sub_level
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {sl.sub_level}
                                </button>
                            ))}
                            {subLevels.length === 0 && <span className="text-gray-400 text-sm py-2">Select level first</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Config & Preview Panel */}
            {config && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Configuration */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Settings className="text-gray-400" size={20} />
                            Pool Configuration
                        </h3>

                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                <CheckCircle2 size={16} /> {successMessage}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Questions per Student
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={config.questions_per_student}
                                        onChange={(e) => handleConfigChange('questions_per_student', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xl font-bold text-blue-600 w-8 text-center">
                                        {config.questions_per_student}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Number of questions each student receives for this test.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Randomization Mode
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleConfigChange('randomization_mode', 'FIXED')}
                                        className={`p-3 rounded-lg border text-left transition-all ${config.randomization_mode === 'FIXED'
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500'
                                                : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm mb-1">Fixed Set</div>
                                        <div className="text-xs text-gray-500">Same random set for one student forever</div>
                                    </button>
                                    <button
                                        onClick={() => handleConfigChange('randomization_mode', 'DYNAMIC')}
                                        className={`p-3 rounded-lg border text-left transition-all ${config.randomization_mode === 'DYNAMIC'
                                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500'
                                                : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm mb-1">Dynamic / Attempt</div>
                                        <div className="text-xs text-gray-500">New random set on every attempt</div>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.is_active}
                                        onChange={(e) => handleConfigChange('is_active', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Test Enabled</span>
                                </label>

                                <button
                                    onClick={handleSaveConfig}
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <RefreshCw className="text-gray-400" size={20} />
                                Random Simulation
                            </h3>
                            <button
                                onClick={() => loadPreview(config.questions_per_student)}
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <RefreshCw size={14} /> Regenerate
                            </button>
                        </div>

                        {loadingPreview ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : previewQuestions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 italic">
                                No active questions found for this pool.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {previewQuestions.map((q, i) => (
                                    <li key={q.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-start gap-3">
                                        <div className="bg-gray-100 text-gray-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-gray-800">{q.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] uppercase tracking-wide bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                    {q.problem_type}
                                                </span>
                                                <span className="text-xs text-gray-400">ID: {q.id}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {previewQuestions.length > 0 && (
                            <div className="mt-4 text-center text-xs text-gray-500">
                                Displaying {previewQuestions.length} randomly selected questions based on current config.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
