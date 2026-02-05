import { useState, useEffect } from 'react';
import { Search, UserX, User, Mail, CheckCircle, XCircle, Plus } from 'lucide-react';
import { fetchStudents, updateStudentStatus, updateStudentLevel, createUser, updateUser, bulkImportUsers } from '../../api/adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    authProvider: 'GOOGLE',
    password: '',
    enrollmentNo: '',
    rollNo: '',
  });
  const levels = ["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B", "4C", "5A", "5B", "5C"];

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function loadUsers(query) {
    try {
      setLoading(true);
      const data = await fetchStudents(query);
      setUsers(data.students || []);
      setSelectedUsers([]);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAll(checked) {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  }

  function handleSelectUser(userId, checked) {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  }

  async function handleBlockUsers() {
    if (selectedUsers.length === 0) {
      alert('Please select users to block');
      return;
    }

    if (!confirm(`Block ${selectedUsers.length} selected user(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(selectedUsers.map(id => updateStudentStatus(id, { isActive: false })));
      await loadUsers(searchTerm);
    } catch (err) {
      alert('Failed to block users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblockUsers() {
    if (selectedUsers.length === 0) {
      alert('Please select users to unblock');
      return;
    }

    if (!confirm(`Unblock ${selectedUsers.length} selected user(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(selectedUsers.map(id => updateStudentStatus(id, { isActive: true })));
      await loadUsers(searchTerm);
    } catch (err) {
      alert('Failed to unblock users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleUser(user) {
    try {
      setLoading(true);
      await updateStudentStatus(user.id, { isActive: !user.is_active });
      await loadUsers(searchTerm);
    } catch (err) {
      alert('Failed to update user: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLevelChange(user, level) {
    try {
      setLoading(true);
      await updateStudentLevel(user.id, { level });
      await loadUsers(searchTerm);
    } catch (err) {
      alert('Failed to update level: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      setCreating(true);
      await createUser({
        fullName: newUser.fullName,
        email: newUser.email,
        roleId: 1,
        authProvider: newUser.authProvider,
        password: newUser.authProvider === 'LOCAL' ? newUser.password : undefined,
        enrollmentNo: newUser.enrollmentNo,
        rollNo: newUser.rollNo,
      });
      setShowCreate(false);
      setNewUser({
        fullName: '',
        email: '',
        authProvider: 'GOOGLE',
        password: '',
        enrollmentNo: '',
        rollNo: '',
      });
      await loadUsers(searchTerm);
    } catch (err) {
      alert('Failed to create user: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkFile) {
      alert('Choose a file first');
      return;
    }

    try {
      setBulkLoading(true);
      await bulkImportUsers(bulkFile);
      setBulkFile(null);
      await loadUsers(searchTerm);
      alert('Bulk import completed');
    } catch (err) {
      alert('Bulk import failed: ' + err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  function openEdit(user) {
    setEditingUser(user);
    setEditData({
      fullName: user.full_name || '',
      email: user.email || '',
      enrollmentNo: user.enrollment_no || '',
      rollNo: user.roll_no || '',
      authProvider: user.auth_provider || 'GOOGLE',
      password: '',
      isActive: Boolean(user.is_active),
    });
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setCreating(true);
      await updateUser(editingUser.id, {
        fullName: editData.fullName,
        email: editData.email,
        enrollmentNo: editData.enrollmentNo,
        rollNo: editData.rollNo,
        roleId: 1,
        authProvider: editData.authProvider,
        password: editData.authProvider === 'LOCAL' ? editData.password : undefined,
        isActive: editData.isActive,
      });
      setEditingUser(null);
      setEditData(null);
      await loadUsers(searchTerm);
    } catch (err) {
      alert('Failed to update user: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student accounts and levels</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
            />
            Bulk Import
          </label>
          <button
            onClick={handleBulkImport}
            disabled={bulkLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {bulkLoading ? 'Importing...' : 'Upload'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auth Provider</label>
                <select
                  value={newUser.authProvider}
                  onChange={(e) => setNewUser({ ...newUser, authProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="GOOGLE">Google</option>
                  <option value="LOCAL">Local Password</option>
                </select>
              </div>
              {newUser.authProvider === 'LOCAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
                <input
                  type="text"
                  value={newUser.enrollmentNo}
                  onChange={(e) => setNewUser({ ...newUser, enrollmentNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
                <input
                  type="text"
                  value={newUser.rollNo}
                  onChange={(e) => setNewUser({ ...newUser, rollNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll number, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex-1"></div>
            <button
              onClick={handleBlockUsers}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
            >
              <UserX className="w-4 h-4" />
              Block Selected
            </button>
            <button
              onClick={handleUnblockUsers}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Unblock Selected
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={users.length.toString()}
          icon={User}
          color="blue"
        />
        <StatCard 
          title="Active Students" 
          value={users.filter(u => u.is_active).length.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard 
          title="Blocked Students" 
          value={users.filter(u => !u.is_active).length.toString()}
          icon={XCircle}
          color="red"
        />
        <StatCard 
          title="Level Assigned" 
          value={users.filter(u => u.current_level).length.toString()}
          icon={User}
          color="purple"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll / Enrollment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{user.full_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="font-mono">{user.roll_no || '-'}</div>
                  <div className="text-xs text-gray-400">{user.enrollment_no || ''}</div>
                  <div className="text-xs text-gray-500">{user.staff_id ? `Staff ID: ${user.staff_id}` : ''}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.current_level || "1A"}
                    onChange={(e) => handleLevelChange(user, e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleUser(user)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm ${
                        user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {user.is_active ? 'Block' : 'Unblock'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {loading ? 'Loading users...' : searchTerm ? 'No users found' : 'No users yet'}
            </p>
          </div>
        )}
      </div>

      {editingUser && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auth Provider</label>
                  <select
                    value={editData.authProvider}
                    onChange={(e) => setEditData({ ...editData, authProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="GOOGLE">Google</option>
                    <option value="LOCAL">Local Password</option>
                  </select>
                </div>
                {editData.authProvider === 'LOCAL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={editData.password}
                      onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
                  <input
                    type="text"
                    value={editData.enrollmentNo}
                    onChange={(e) => setEditData({ ...editData, enrollmentNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
                  <input
                    type="text"
                    value={editData.rollNo}
                    onChange={(e) => setEditData({ ...editData, rollNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
