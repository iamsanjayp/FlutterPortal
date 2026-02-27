import { useState, useEffect } from 'react';
import { Layers, FileText, Users, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import MetricCard from '../../components/MetricCard';
import PerformanceChart from '../../components/PerformanceChart';
import { fetchDashboardMetrics, fetchPerformanceData, fetchAvailableLevels } from '../../api/dashboardApi';

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [performanceData, setPerformanceData] = useState([]);
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [timePeriod, setTimePeriod] = useState('30d');

    useEffect(() => {
        loadDashboardData();
        loadLevels();
    }, []);

    useEffect(() => {
        loadPerformanceData();
    }, [selectedLevel, timePeriod]);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const data = await fetchDashboardMetrics();
            setMetrics(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load dashboard metrics:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadPerformanceData() {
        try {
            const data = await fetchPerformanceData(selectedLevel, timePeriod);
            setPerformanceData(data.performance || []);
        } catch (err) {
            console.error('Failed to load performance data:', err);
        }
    }

    async function loadLevels() {
        try {
            const data = await fetchAvailableLevels();
            setLevels(data.levels || []);
        } catch (err) {
            console.error('Failed to load levels:', err);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Failed to load dashboard: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1">Overview of React Native assessment platform</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Levels"
                    value={metrics?.total_levels || 0}
                    icon={Layers}
                    color="blue"
                />
                <MetricCard
                    title="Total Sub-levels"
                    value={metrics?.total_sub_levels || 0}
                    icon={Activity}
                    color="purple"
                />
                <MetricCard
                    title="Total Questions"
                    value={metrics?.total_questions || 0}
                    icon={FileText}
                    color="green"
                    subtitle="CODE + UI types"
                />
                <MetricCard
                    title="Active Students"
                    value={metrics?.active_students || 0}
                    icon={Users}
                    color="orange"
                    subtitle={`of ${metrics?.total_students || 0} total`}
                />
                <MetricCard
                    title="Total Students"
                    value={metrics?.total_students || 0}
                    icon={Users}
                    color="indigo"
                />
                <MetricCard
                    title="Avg Completion Rate"
                    value={`${metrics?.avg_completion_rate || 0}%`}
                    icon={TrendingUp}
                    color="red"
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Filter by Level:</label>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Levels</option>
                            {levels.map(level => (
                                <option key={level.id} value={level.number}>
                                    {level.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Time Period:</span>
                        <button
                            onClick={() => setTimePeriod('7d')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${timePeriod === '7d'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setTimePeriod('30d')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${timePeriod === '30d'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setTimePeriod('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${timePeriod === 'all'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Time
                        </button>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <PerformanceChart data={performanceData} />

            {/* Recent Activity (Optional Enhancement) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-gray-700">
                            <strong>Rahul Kumar</strong> completed Level 3A assessment
                        </p>
                        <span className="ml-auto text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-gray-700">
                            <strong>Admin</strong> added 3 new questions to Level 2B
                        </p>
                        <span className="ml-auto text-xs text-gray-500">5 hours ago</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <p className="text-sm text-gray-700">
                            <strong>15 students</strong> started Level 1A assessment
                        </p>
                        <span className="ml-auto text-xs text-gray-500">1 day ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
