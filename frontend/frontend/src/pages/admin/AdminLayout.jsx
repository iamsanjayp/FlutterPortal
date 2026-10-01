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
  ClipboardCheck,
  MessageSquare,
  Menu,
  X
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
import AdminExecutionRuns from "./AdminExecutionRuns";
import AdminFeedback from "./AdminFeedback";

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
  { key: "executions", label: "Execution Runs", icon: Activity },
  { key: "feedback", label: "Student Feedback", icon: MessageSquare },
];

export default function AdminLayout({ user, onLogout }) {
  const isTeacher = user?.role_id === 2;
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = useMemo(() => {
    return PAGES.find(page => page.key === activePage)?.label || "Admin";
  }, [activePage]);

  const visiblePages = useMemo(() => {
    if (!isTeacher) return PAGES;
    return PAGES.filter(page => !["levels", "scheduling", "students", "staff"].includes(page.key));
  }, [isTeacher]);

  function handleSelectPage(key) {
    setActivePage(key);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-xs">
        <div className="h-full flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-xs">
              <img src={logo} alt="Portal logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight leading-tight">
                PCDP Flutter Admin
              </h1>
              <p className="text-[11px] text-gray-500 hidden sm:block">Assessment & Lab Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Profile */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {user?.full_name || 'Administrator'}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  {user?.roll_no || user?.staff_id || (isTeacher ? 'Teacher' : 'Admin')}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xs text-white font-bold text-xs">
                {user?.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 left-0 w-60 bottom-0 bg-white border-r border-gray-200 z-50 md:z-40 shadow-sm transition-transform duration-200 ease-in-out flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {visiblePages.map(page => {
            const Icon = page.icon;
            const isActive = activePage === page.key;
            
            return (
              <button
                key={page.key}
                onClick={() => handleSelectPage(page.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-xs truncate">{page.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all font-semibold text-xs"
          >
            <LogOut className="w-4 h-4 text-gray-400 hover:text-rose-600" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-60 ml-0 mt-16 p-4 sm:p-6 lg:p-8 flex-1 transition-all">
        {activePage === "dashboard" && <AdminHome onNavigate={setActivePage} />}
        {activePage === "levels" && <AdminLevels />}
        {activePage === "questions" && <AdminQuestionsNew />}
        {activePage === "scheduling" && <AdminTestSlots />}
        {activePage === "tests" && <AdminLiveTests />}
        {activePage === "students" && <AdminUsers />}
        {activePage === "staff" && <AdminStaff />}
        {activePage === "submissions" && <AdminSubmissions />}
        {activePage === "manual-grading" && <AdminManualGrading />}
        {activePage === "executions" && <AdminExecutionRuns />}
        {activePage === "feedback" && <AdminFeedback />}
      </main>
    </div>
  );
}

