import { useMemo, useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Activity, 
  Users, 
  FileText,
  LogOut,
  AlertCircle
} from 'lucide-react';
import AdminHome from "./AdminHome";
import AdminQuestionsNew from "./AdminQuestions_new";
import AdminTestSlots from "./AdminTestSlots";
import AdminLiveTests from "./AdminLiveTests";
import AdminUsers from "./AdminUsers";
import AdminSubmissions from "./AdminSubmissions";

const PAGES = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "questions", label: "Question Bank", icon: BookOpen },
  { key: "scheduling", label: "Test Slots", icon: Calendar },
  { key: "tests", label: "Live Tests", icon: Activity },
  { key: "students", label: "Users", icon: Users },
  { key: "submissions", label: "Submissions", icon: FileText },
];

export default function AdminLayout({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");

  const pageTitle = useMemo(() => {
    return PAGES.find(page => page.key === activePage)?.label || "Admin";
  }, [activePage]);

  // Mock active tests count
  const activeTestsCount = 2;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">PC</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">PCDP Admin</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Active Tests Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700">{activeTestsCount} Active Tests</span>
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.roll_no || '737624ICS361'}</p>
                <p className="text-xs text-gray-500">{user?.full_name || 'SANJAY P'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-medium text-sm">
                  {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed top-16 left-0 w-52 bottom-0 bg-white border-r border-gray-200 z-40 shadow-sm">
        <nav className="p-4 space-y-1">
          {PAGES.map(page => {
            const Icon = page.icon;
            const isActive = activePage === page.key;
            
            return (
              <button
                key={page.key}
                onClick={() => setActivePage(page.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{page.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-52 mt-16 p-8">
        {activePage === "dashboard" && <AdminHome />}
        {activePage === "questions" && <AdminQuestionsNew />}
        {activePage === "scheduling" && <AdminTestSlots />}
        {activePage === "tests" && <AdminLiveTests />}
        {activePage === "students" && <AdminUsers />}
        {activePage === "submissions" && <AdminSubmissions />}
      </div>
    </div>
  );
}
