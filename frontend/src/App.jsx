import { AuthProvider, useAuth } from "./context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import StaffLayout from "./pages/staff/StaffLayout";
import AdminLayout from "./pages/admin/AdminLayoutDynamic";
import ReactNativePage from "./pages/ReactNativePage";
import VMAssessmentPage from "./pages/VMAssessmentPage";
import RoleGuard from "./components/RoleGuard";

// Check if a level falls in the 4A-4C range (VM-based assessment)
function isVMLevel(level) {
  return level && level.startsWith('4');
}

function AppRoutes() {
  const { user, role, isAuthenticated, loading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={refreshUser} />;
  }

  // Admin routes
  if (role === 'admin') {
    return (
      <RoleGuard allowedRoles={['admin']}>
        <AdminLayout user={user} onLogout={logout} />
      </RoleGuard>
    );
  }

  // Staff routes
  if (role === 'staff') {
    return (
      <RoleGuard allowedRoles={['staff']}>
        <StaffLayout user={user} onLogout={logout} />
      </RoleGuard>
    );
  }

  // Student routes
  if (role === 'student') {
    const isAssessment = location.pathname === '/assessment';

    // If matches /assessment route, show assessment page
    if (isAssessment) {
      const studentLevel = user?.level || '3A';
      const vmMode = isVMLevel(studentLevel);

      return (
        <div className="h-screen flex flex-col">

          <div className="flex-1 overflow-hidden">
            {vmMode ? (
              <VMAssessmentPage
                level={studentLevel}
                durationMinutes={user?.durationMinutes || 90}
                onEndTest={() => {
                  localStorage.removeItem('assessment_session');
                  localStorage.removeItem('current_problem');
                  localStorage.removeItem('assessment_code');
                  navigate('/');
                }}
              />
            ) : (
              <ReactNativePage
                level={studentLevel}
                durationMinutes={user?.durationMinutes || 90}
                onEndTest={() => {
                  localStorage.removeItem('assessment_session');
                  localStorage.removeItem('current_problem');
                  localStorage.removeItem('assessment_code');
                  navigate('/');
                }}
              />
            )}
          </div>
        </div>
      );
    }

    // Otherwise show dashboard
    return (
      <StudentDashboard
        user={user}
        level={user?.level || '3A'}
        durationMinutes={user?.durationMinutes || 90}
        questionCount={user?.questionCount || 1}
        onPlayground={() => {
          navigate('/assessment');
        }}
        onLogout={logout}
      />
    );
  }

  // Fallback - shouldn't happen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold text-gray-900">Unknown Role</div>
        <button
          onClick={logout}
          className="mt-2 px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
