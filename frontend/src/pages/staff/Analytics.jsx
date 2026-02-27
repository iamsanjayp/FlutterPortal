import React, { useState, useEffect } from 'react';
import { BarChart, Users, Award, Clock, Download, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchAnalytics } from '../../api/analyticsApi';
import { fetchSkills, fetchLevels } from '../../api/questionApi';

export default function Analytics() {
    // Data state
    const [stats, setStats] = useState({
        total_students: 0,
        active_students: 0,
        avg_score: 0,
        avg_completion: 0
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter state
    const [filters, setFilters] = useState({
        skill: 'all',
        level: 'all',
        subLevel: 'all'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'avg_score', direction: 'desc' });

    // Options
    const [skills, setSkills] = useState([]);
    const [levels, setLevels] = useState([]);

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadOptions = async () => {
        try {
            const skillData = await fetchSkills();
            setSkills(skillData.skills || []);
            // Initial levels
            setLevels([1, 2, 3, 4, 5]);
        } catch (err) {
            console.error("Failed to load options", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAnalytics(filters);
            setStats(data.stats);
            setStudents(data.students);
            setError(null);
        } catch (err) {
            setError("Failed to load analytics data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStudents = React.useMemo(() => {
        let sortableStudents = [...students];
        if (searchTerm) {
            sortableStudents = sortableStudents.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig.key) {
            sortableStudents.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableStudents;
    }, [students, sortConfig, searchTerm]);

    const handleExport = () => {
        const headers = ["Roll No", "Name", "Score", "Completion %", "Solved"];
        const csvContent = [
            headers.join(","),
            ...sortedStudents.map(s => [
                s.roll_no,
                s.name,
                s.avg_score,
                s.completion_rate,
                s.solved_count
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `student_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Performance Analytics</h1>
                    <p className="text-gray-500 mt-1">Track student progress and engagement metrics</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total_students}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Average Score</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.avg_score}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                        <Award size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Avg. Completion</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.avg_completion}%</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <BarChart size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Active (7 Days)</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.active_students}</h3>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters & Search */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-gray-500 mr-2">
                            <Filter size={16} />
                            <span className="font-medium text-sm">Filters:</span>
                        </div>

                        <select
                            value={filters.skill}
                            onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                        >
                            <option value="all">All Skills</option>
                            {skills.map(s => (
                                <option key={s.slug} value={s.slug}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            value={filters.level}
                            onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px]"
                        >
                            <option value="all">All Levels</option>
                            {levels.map(l => (
                                <option key={l} value={l}>Level {l}</option>
                            ))}
                        </select>
                        <select
                            value={filters.subLevel}
                            onChange={(e) => setFilters(prev => ({ ...prev, subLevel: e.target.value }))}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px]"
                        >
                            <option value="all">Sub-levels</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Student {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('roll_no')}>
                                        <div className="flex items-center gap-1">Roll No {sortConfig.key === 'roll_no' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('solved_count')}>
                                        <div className="flex items-center gap-1 justify-center">Solved {sortConfig.key === 'solved_count' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('completion_rate')}>
                                        <div className="flex items-center gap-1">Completion {sortConfig.key === 'completion_rate' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('avg_score')}>
                                        <div className="flex items-center gap-1">Avg Score {sortConfig.key === 'avg_score' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</div>
                                    </th>
                                    <th className="px-6 py-4">Current Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No students found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {student.name}
                                                <div className="text-xs text-gray-400 mt-0.5 md:hidden">{student.roll_no}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{student.roll_no}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                    {student.solved_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-green-500 h-full rounded-full"
                                                            style={{ width: `${student.completion_rate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-600 font-medium w-8 text-right">{student.completion_rate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`font-bold ${student.avg_score >= 80 ? 'text-green-600' :
                                                        student.avg_score >= 50 ? 'text-yellow-600' : 'text-red-500'
                                                    }`}>
                                                    {student.avg_score}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                    Level {student.current_level}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && sortedStudents.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 text-xs text-gray-500">
                        Showing {sortedStudents.length} students
                    </div>
                )}
            </div>
        </div>
    );
}
