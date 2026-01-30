import { useState, useEffect } from 'react';
import { Search, UserX, User, Mail, CheckCircle, XCircle } from 'lucide-react';
import { fetchStudents, updateStudentStatus, updateStudentLevel } from '../../api/adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
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

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student accounts and permissions</p>
        </div>
      </div>

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
          title="Total Users" 
          value={users.length.toString()}
          icon={User}
          color="blue"
        />
        <StatCard 
          title="Students" 
          value={users.length.toString()}
          icon={User}
          color="purple"
        />
        <StatCard 
          title="Active Users" 
          value={users.filter(u => u.is_active).length.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard 
          title="Blocked Users" 
          value={users.filter(u => !u.is_active).length.toString()}
          icon={XCircle}
          color="red"
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
                  <button
                    onClick={() => handleToggleUser(user)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm ${
                      user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {user.is_active ? 'Block' : 'Unblock'}
                  </button>
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
