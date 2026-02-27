import { X } from 'lucide-react';

export default function RoleChangeModal({ user, onConfirm, onClose }) {
    const [selectedRole, setSelectedRole] = React.useState(user?.role || 'student');
    const [loading, setLoading] = React.useState(false);

    const roles = [
        { value: 'student', label: 'Student', color: 'blue' },
        { value: 'staff', label: 'Staff', color: 'purple' },
        { value: 'admin', label: 'Admin', color: 'red' }
    ];

    async function handleConfirm() {
        setLoading(true);
        try {
            await onConfirm(selectedRole);
            onClose();
        } catch (error) {
            console.error('Failed to change role:', error);
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">User</p>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select New Role
                        </label>
                        <div className="space-y-2">
                            {roles.map(role => (
                                <label
                                    key={role.value}
                                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={selectedRole === role.value}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-900">
                                        {role.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {selectedRole !== user.role && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>Warning:</strong> Changing the role will immediately update the user's permissions.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || selectedRole === user.role}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Updating...' : 'Confirm Change'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Import React at the top
import React from 'react';
