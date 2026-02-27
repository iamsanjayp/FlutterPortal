import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ allowedRoles, redirectTo = '/dashboard', children }) {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    // Not authenticated - show nothing, let parent handle redirect
    if (!isAuthenticated) {
        return null;
    }

    // Not authorized for this role
    if (!allowedRoles.includes(role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-3">
                    <div className="text-lg font-semibold text-gray-900">Access Denied</div>
                    <div className="text-sm text-gray-600">
                        You don't have permission to access this resource.
                    </div>
                    <button
                        onClick={() => window.location.href = redirectTo}
                        className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return children;
}
