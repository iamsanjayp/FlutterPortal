import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { fetchSkills, fetchLevels, fetchSubLevels, createQuestion, updateQuestion } from '../api/questionApi';

export default function QuestionEditor({ question = null, onClose, onSave }) {
    const isEditMode = !!question;

    // Form state
    const [formData, setFormData] = useState({
        skill: '',
        levelNumber: '',
        subLevel: '',
        title: '',
        description: '',
        starterCode: '',
        sampleImageBase64: null,
        isActive: true,
        problemType: 'UI' // Default to UI
    });

    // Dropdown options
    const [skills, setSkills] = useState([]);
    const [levels, setLevels] = useState([]); // [1, 2, 3, 4, 5]
    const [subLevels, setSubLevels] = useState(['A', 'B', 'C']); // Default, can be dynamic

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial load
    useEffect(() => {
        loadSkills();

        // Populate form if editing
        if (question) {
            setFormData({
                skill: question.skill || '',
                levelNumber: question.level_number || '',
                subLevel: question.sub_level || '',
                title: question.title || '',
                description: question.description || '',
                starterCode: question.starter_code || '',
                sampleImageBase64: question.sample_image_base64 || null,
                isActive: question.is_active,
                problemType: question.problem_type || 'UI'
            });
        }
    }, [question]);

    // Fetch skills
    const loadSkills = async () => {
        try {
            const data = await fetchSkills();
            setSkills(data.skills || []);
            // Set default level options 1-5
            setLevels([1, 2, 3, 4, 5]);
        } catch (err) {
            console.error("Failed to load skills", err);
            // Fallback
            setSkills([{ name: 'React Native', slug: 'react-native' }, { name: 'Flutter', slug: 'flutter' }]);
            setLevels([1, 2, 3, 4, 5]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (base64) => {
        // Remove data:image/...;base64, prefix if sending to backend that expects raw base64
        // But our backend handles buffer from base64 string, so data URI is usually fine 
        // IF we strip it in backend. My backend code uses `Buffer.from(base64, "base64")`
        // which might fail with data URI prefix. Let's strip it to be safe.

        let cleanerBase64 = base64;
        if (base64 && base64.includes('base64,')) {
            cleanerBase64 = base64.split('base64,')[1];
        }

        setFormData(prev => ({
            ...prev,
            sampleImageBase64: cleanerBase64
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isEditMode) {
                await updateQuestion(question.id, formData);
            } else {
                await createQuestion(formData);
            }
            onSave(); // Refresh parent list
            onClose(); // Close modal
        } catch (err) {
            setError(err.message || "Failed to save question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEditMode ? 'Edit Question' : 'Create New Question'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {/* Meta Data Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Skill */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Skill <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="skill"
                                    value={formData.skill}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Select Skill</option>
                                    {skills.map(skill => (
                                        <option key={skill.slug} value={skill.slug}>{skill.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="levelNumber"
                                    value={formData.levelNumber}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Select Level</option>
                                    {levels.map(l => (
                                        <option key={l} value={l}>Level {l}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sub-level <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="subLevel"
                                    value={formData.subLevel}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Select</option>
                                    {subLevels.map(sl => (
                                        <option key={sl} value={sl}>{sl}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Problem Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    name="problemType"
                                    value={formData.problemType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="UI">UI Design</option>
                                    <option value="CODE">Logic / Code</option>
                                </select>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Build a Login Screen"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Problem Statement</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Describe the problem requirements..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-y"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <ImageUpload
                                value={formData.sampleImageBase64 ? `data:image/png;base64,${formData.sampleImageBase64}` : null}
                                onChange={handleImageChange}
                                label="Sample Image / Mockup"
                            />
                        </div>

                        {/* Starter Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Starter Code (Optional)</label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <textarea
                                    name="starterCode"
                                    value={formData.starterCode}
                                    onChange={handleChange}
                                    rows={8}
                                    spellCheck="false"
                                    placeholder="// Write starter code here..."
                                    className="w-full px-4 py-3 font-mono text-sm bg-gray-50 focus:bg-white focus:outline-none resize-y"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                This code will be provided to the student as a starting point.
                            </p>
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">
                                    {formData.isActive ? 'Active (Visible to students)' : 'Draft / Inactive'}
                                </span>
                            </label>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                {isEditMode ? 'Update Question' : 'Create Question'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
