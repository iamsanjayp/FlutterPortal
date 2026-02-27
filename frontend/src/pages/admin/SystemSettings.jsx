import React, { useState, useEffect } from 'react';
import { Save, Shield, Clock, FileText, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchSettings, updateSettings } from '../../api/settingsApi';

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        allow_registration: true,
        default_questions_count: 5,
        exam_duration_minutes: 60,
        support_email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await fetchSettings();
            setSettings(prev => ({ ...prev, ...data.settings }));
            setError(null);
        } catch (err) {
            setError("Failed to load settings");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        // Clear status messages on change
        if (success) setSuccess(null);
        if (error) setError(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await updateSettings(settings);
            setSuccess("Settings updated successfully");
            // Auto hide success message
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to save settings");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
                    <p className="text-gray-500 mt-1">Configure global application parameters and rules</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Status Messages */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        {success}
                    </div>
                )}

                {/* Access Control */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="text-gray-400" size={20} />
                        Access Control
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Maintenance Mode</div>
                                <div className="text-sm text-gray-500">Prevent non-admin users from accessing the platform</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenance_mode}
                                    onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Allow New Registration</div>
                                <div className="text-sm text-gray-500">Enable or disable student registration page</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.allow_registration}
                                    onChange={(e) => handleChange('allow_registration', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Exam Defaults */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="text-gray-400" size={20} />
                        Exam Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default Questions Count
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={settings.default_questions_count}
                                    onChange={(e) => handleChange('default_questions_count', parseInt(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                                <FileText className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Standard number of questions per exam session</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Exam Duration (Minutes)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="10"
                                    max="300"
                                    value={settings.exam_duration_minutes}
                                    onChange={(e) => handleChange('exam_duration_minutes', parseInt(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Default time limit for completion</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
