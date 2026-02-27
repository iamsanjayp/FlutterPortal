import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    CheckSquare,
    Settings,
    LogOut,
    BarChart3
} from 'lucide-react';
import { useState } from 'react';

const ADMIN_MENU = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'problems', label: 'Problems', icon: FileText, path: '/admin/problems' },
    { id: 'schedules', label: 'Schedules', icon: Calendar, path: '/admin/schedules' },
    { id: 'submissions', label: 'Submissions', icon: CheckSquare, path: '/admin/submissions' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

const STAFF_MENU = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/staff' },
    { id: 'problems', label: 'Problems', icon: FileText, path: '/staff/problems' },
    { id: 'submissions', label: 'Submissions', icon: CheckSquare, path: '/staff/submissions' },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/staff/reports' },
];

export default function Sidebar({ role, activeRoute = '', onNavigate, onLogout }) {
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = role === 'admin' ? ADMIN_MENU : role === 'staff' ? STAFF_MENU : [];

    const handleItemClick = (path) => {
        if (onNavigate) {
            onNavigate(path);
        }
    };

    return (
        <div className={`bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <div>
                            <h2 className="text-lg font-semibold">Portal</h2>
                            <p className="text-xs text-gray-400 capitalize">{role}</p>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeRoute === item.path || activeRoute.startsWith(item.path + '/');

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isActive
                                    ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>
        </div>
    );
}
