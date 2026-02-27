import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchQuestionsByPath } from '../../api/skillApi';

export default function DynamicQuestions() {
    const { skill, level, subLevel } = useParams();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadQuestions();
    }, [skill, level, subLevel]);

    async function loadQuestions() {
        try {
            setLoading(true);
            const data = await fetchQuestionsByPath(skill, level, subLevel);
            setQuestions(data.questions || []);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load questions:', err);
            // For now, just show mock data message
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }

    const displayPath = `${skill} / Level ${level} / ${level}${subLevel}`;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
                        <p className="text-sm text-gray-600 mt-1">{displayPath}</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        Add Question
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                {loading && (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-500">Loading questions...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Backend API not yet implemented.
                            This will show questions for <strong>{displayPath}</strong> when connected to the backend.
                        </p>
                    </div>
                )}

                {!loading && !error && questions.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-3">No questions found for this sub-level</p>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                            Create First Question
                        </button>
                    </div>
                )}

                {!loading && questions.length > 0 && (
                    <div className="space-y-3">
                        {questions.map((question, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{question.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
