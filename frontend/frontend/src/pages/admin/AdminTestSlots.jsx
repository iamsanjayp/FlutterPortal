import { useState, useEffect } from 'react';
import { Plus, Edit, Calendar, Clock } from 'lucide-react';
import { 
  fetchSchedules, 
  createSchedule, 
  updateSchedule,
  fetchTeachers
} from '../../api/adminApi';

export default function AdminTestSlots() {
  const [slots, setSlots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    loadSlots();
    loadTeachers();
  }, []);

  async function loadSlots() {
    try {
      setLoading(true);
      const data = await fetchSchedules();
      setSlots(data.schedules || []);
    } catch (err) {
      console.error('Failed to load test slots:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeachers() {
    try {
      const data = await fetchTeachers();
      setTeachers(data.students || []);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    }
  }

  function handleCreate() {
    setEditingSlot(null);
    setShowForm(true);
  }

  function handleEdit(slot) {
    setEditingSlot(slot);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingSlot(null);
    loadSlots();
  }

  async function handleToggleActive(slot) {
    try {
      setLoading(true);
      await updateSchedule(slot.id, { isActive: !slot.is_active });
      await loadSlots();
    } catch (err) {
      alert('Failed to update slot: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Test Slots</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Slot
        </button>
      </div>

      {showForm && (
        <SlotForm 
          slot={editingSlot}
          teachers={teachers}
          onClose={handleFormClose}
        />
      )}

        <SlotsTable 
          slots={slots}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          loading={loading}
        />
    </div>
  );
}

function SlotsTable({ slots, onEdit, onToggleActive, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading test slots...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Live Teacher</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code Reviewer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UI Reviewer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {slots.map((slot) => {
            const startTime = new Date(slot.start_at);
            const endTime = new Date(slot.end_at);
            const now = new Date();
            const isActive = slot.is_active && now >= startTime && now <= endTime;
            const isUpcoming = now < startTime;

            return (
              <tr key={slot.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{slot.name || 'Test Slot'}</div>
                      <div className="text-xs text-gray-500">ID: {slot.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">-</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {startTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {endTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {slot.duration_minutes || 0} min
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {slot.live_teacher_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {slot.code_reviewer_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {slot.ui_reviewer_name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : isUpcoming
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(slot)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleActive(slot)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm ${
                        slot.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {slot.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {slots.length === 0 && (
        <div className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No test slots scheduled. Create your first slot!</p>
        </div>
      )}
    </div>
  );
}

function SlotForm({ slot, onClose, teachers }) {
  const [formData, setFormData] = useState({
    name: slot?.name || '',
    startAt: slot?.start_at ? new Date(slot.start_at).toISOString().slice(0, 16) : '',
    endAt: slot?.end_at ? new Date(slot.end_at).toISOString().slice(0, 16) : '',
    durationMinutes: slot?.duration_minutes || 30,
    isActive: slot?.is_active ? true : false,
    liveTeacherId: slot?.live_teacher_id || '',
    codeReviewerId: slot?.code_reviewer_id || '',
    uiReviewerId: slot?.ui_reviewer_id || '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      if (slot?.id) {
        await updateSchedule(slot.id, formData);
      } else {
        await createSchedule(formData);
      }
      onClose();
    } catch (err) {
      alert('Failed to save test slot: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {slot?.id ? 'Edit Test Slot' : 'Create Test Slot'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slot Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Level 1A - Batch A"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="1"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Live Test Teacher</label>
            <select
              value={formData.liveTeacherId}
              onChange={(e) => setFormData({ ...formData, liveTeacherId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code Review Teacher</label>
            <select
              value={formData.codeReviewerId}
              onChange={(e) => setFormData({ ...formData, codeReviewerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UI Review Teacher</label>
            <select
              value={formData.uiReviewerId}
              onChange={(e) => setFormData({ ...formData, uiReviewerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active slot</label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : slot?.id ? 'Update Slot' : 'Create Slot'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
