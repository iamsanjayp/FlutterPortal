import { useMemo, useState } from "react";
import logo from "../../../logo.png";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Activity, 
  Users, 
  FileText,
  LogOut,
  Settings,
  ClipboardCheck
} from 'lucide-react';
import AdminHome from "./AdminHome";
import AdminQuestionsNew from "./AdminQuestions_new";
import AdminLevels from "./AdminLevels";
import AdminTestSlots from "./AdminTestSlots";
import AdminLiveTests from "./AdminLiveTests";
import AdminUsers from "./AdminUsers";
import AdminStaff from "./AdminStaff";
import AdminSubmissions from "./AdminSubmissions";
import AdminManualGrading from "./AdminManualGrading";

const PAGES = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "levels", label: "Levels", icon: Settings },
  { key: "questions", label: "Question Bank", icon: BookOpen },
  { key: "scheduling", label: "Test Slots", icon: Calendar },
  { key: "tests", label: "Live Tests", icon: Activity },
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: Users },
  { key: "submissions", label: "Code Review - Coding Test", icon: FileText },
  { key: "manual-grading", label: "Code Review - UI Test", icon: ClipboardCheck },
];

export default function AdminLayout({ user, onLogout }) {
  const isTeacher = user?.role_id === 2;
  const [activePage, setActivePage] = useState("dashboard");

  const pageTitle = useMemo(() => {
    return PAGES.find(page => page.key === activePage)?.label || "Admin";
  }, [activePage]);
  const visiblePages = useMemo(() => {
    if (!isTeacher) return PAGES;
    return PAGES.filter(page => !["levels", "scheduling", "students", "staff"].includes(page.key));
  }, [isTeacher]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md bg-white">
              <img src={logo} alt="Portal logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">PS Flutter Admin Portal</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.roll_no || user?.staff_id ||'ADMIN'}</p>
                <p className="text-xs text-gray-500">{user?.full_name || 'ADMIN_UNKNOWN'}</p>
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
          {visiblePages.map(page => {
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
        {activePage === "levels" && <AdminLevels />}
        {activePage === "questions" && <AdminQuestionsNew />}
        {activePage === "scheduling" && <AdminTestSlots />}
        {activePage === "tests" && <AdminLiveTests />}
        {activePage === "students" && <AdminUsers />}
        {activePage === "staff" && <AdminStaff />}
        {activePage === "submissions" && <AdminSubmissions />}
        {activePage === "manual-grading" && <AdminManualGrading />}
      </div>
    </div>
  );
}
