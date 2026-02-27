import { useState, useEffect } from 'react';
import { Search, UserX, User, Mail, CheckCircle, XCircle, Plus } from 'lucide-react';
import { fetchStudents, updateStudentStatus, updateStudentLevel, createStudent } from '../../api/adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    <div className="space-y-[24px]">
      {showCreateModal && (
        <CreateStudentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => loadUsers(searchTerm)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Users</h1>
          <p className="text-sm text-text-muted mt-1">Manage student accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 h-[36px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors shadow-sm text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          New Student
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[16px]">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-0">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll number, or email..."
              className="w-full pl-9 pr-4 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
            />
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-3 p-[16px] mt-[16px] bg-accent-soft border border-accent/20 rounded-[8px]">
            <span className="text-sm text-accent font-semibold">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex-1"></div>
            <button
              onClick={handleBlockUsers}
              className="flex items-center gap-2 px-4 h-[32px] bg-danger text-white rounded-[6px] hover:bg-danger/90 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <UserX className="w-3.5 h-3.5" />
              Block Selected
            </button>
            <button
              onClick={handleUnblockUsers}
              className="flex items-center gap-2 px-4 h-[32px] bg-success text-white rounded-[6px] hover:bg-success/90 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <CheckCircle className="w-3.5 h-3.5" />
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
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-main border-b border-border-subtle">
            <tr>
              <th className="px-6 py-4 w-12 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-accent border-border-subtle rounded focus:ring-accent bg-surface"
                />
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Roll / Enrollment</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Level</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-main/50 transition-colors">
                <td className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    className="w-4 h-4 text-accent border-border-subtle rounded focus:ring-accent bg-surface"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-accent-soft flex items-center justify-center shrink-0 border border-border-subtle">
                      <span className="text-accent text-sm font-bold">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{user.full_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 min-w-[124px]">
                  <div className="text-[11px] font-mono font-medium bg-main border border-border-subtle px-1.5 py-0.5 rounded text-text-muted inline-block truncate">{user.roll_no || '-'}</div>
                  <div className="text-[10px] text-text-muted mt-1 truncate">{user.enrollment_no || ''}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-text-muted truncate max-w-[200px]" title={user.email}>
                    <Mail className="w-4 h-4 shrink-0 text-text-muted/70" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.current_level || "1A"}
                    onChange={(e) => handleLevelChange(user, e.target.value)}
                    className="rounded-md border border-border-subtle bg-main text-text-primary px-2 py-1 text-sm focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.is_active
                    ? 'bg-success-soft text-success outline outline-1 outline-success/20'
                    : 'bg-danger-soft text-danger outline outline-1 outline-danger/20'
                    }`}>
                    {user.is_active ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleUser(user)}
                    className={`inline-flex items-center gap-1 px-3 h-[28px] rounded-md transition-colors text-[11px] font-bold uppercase tracking-wider border ${user.is_active ? 'bg-danger-soft text-danger border-danger/20 hover:bg-danger hover:text-white' : 'bg-success-soft text-success border-success/20 hover:bg-success hover:text-white'
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
          <div className="p-8 text-center text-text-muted">
            <User className="w-12 h-12 text-border-subtle mx-auto mb-3" />
            <p className="text-sm">
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
    blue: 'bg-accent-soft text-accent',
    purple: 'bg-accent text-white',
    green: 'bg-success-soft text-success',
    red: 'bg-danger-soft text-danger',
  };

  return (
    <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px]">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-[10px] ${colorClasses[color]} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider mb-2">{title}</p>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

function CreateStudentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    enrollmentNo: '',
    rollNo: '',
    level: '1A'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createStudent(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-[10px] shadow-xl w-full max-w-md overflow-hidden border border-border-subtle">
        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-main">
          <h3 className="text-[18px] font-semibold text-text-primary tracking-tight">Add New Student</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-[24px] space-y-4">
          {error && (
            <div className="bg-danger-soft text-danger px-3 py-2 rounded-md text-sm mb-4 outline outline-1 outline-danger/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Full Name</label>
            <input
              required
              type="text"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Email</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Password</label>
            <input
              required
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Enrollment No</label>
              <input
                required
                type="text"
                value={formData.enrollmentNo}
                onChange={e => setFormData({ ...formData, enrollmentNo: e.target.value })}
                className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
                placeholder="EN123456"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Roll No</label>
              <input
                required
                type="text"
                value={formData.rollNo}
                onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
                placeholder="R123"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Initial Level</label>
            <select
              value={formData.level}
              onChange={e => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
            >
              {["1A", "1B", "1C", "2A", "2B", "2C", "3A", "3B", "3C", "4A", "4B", "4C"].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-[40px] bg-main border border-border-subtle text-text-primary rounded-[8px] hover:bg-surface transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-[40px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors disabled:opacity-50 text-xs font-bold uppercase tracking-wider"
            >
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
