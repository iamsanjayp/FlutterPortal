import { useState, useEffect } from 'react';
import { Plus, Edit, Calendar, Clock } from 'lucide-react';
import {
  fetchSchedules,
  createSchedule,
  updateSchedule
} from '../../api/adminApi';

export default function AdminTestSlots() {
  const [slots, setSlots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSlots();
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
    <div className="space-y-[24px]">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-text-primary tracking-tight">Test Slots</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 h-[36px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors shadow-sm text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      </div>

      {showForm && (
        <SlotForm
          slot={editingSlot}
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
      <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[32px] text-center">
        <p className="text-text-muted">Loading test slots...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-main border-b border-border-subtle">
          <tr>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Slot Name</th>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Level</th>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Start Time</th>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">End Time</th>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Duration</th>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-[11px] font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {slots.map((slot) => {
            const startTime = new Date(slot.start_at);
            const endTime = new Date(slot.end_at);
            const now = new Date();
            const isActive = slot.is_active && now >= startTime && now <= endTime;
            const isUpcoming = now < startTime;

            return (
              <tr key={slot.id} className="hover:bg-main/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-accent-soft flex items-center justify-center shrink-0 border border-border-subtle">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{slot.name || 'Test Slot'}</div>
                      <div className="text-[11px] text-text-muted truncate">ID: {slot.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-text-primary">-</td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {startTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-text-muted">
                  {endTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <Clock className="w-4 h-4 text-text-muted" />
                    {slot.duration_minutes || 0} min
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive
                    ? 'bg-success-soft text-success outline outline-1 outline-success/20'
                    : isUpcoming
                      ? 'bg-warning-soft text-warning outline outline-1 outline-warning/20'
                      : 'bg-main text-text-muted outline outline-1 outline-border-subtle'
                    }`}>
                    {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(slot)}
                      className="inline-flex items-center gap-1.5 px-3 h-[28px] bg-surface text-text-primary border border-border-subtle rounded-md hover:bg-main transition-colors text-[11px] font-bold uppercase tracking-wider"
                    >
                      <Edit className="w-3 h-3 text-text-muted" />
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleActive(slot)}
                      className={`inline-flex items-center gap-1.5 px-3 h-[28px] rounded-md transition-colors text-[11px] font-bold uppercase tracking-wider border ${slot.is_active ? 'bg-danger-soft text-danger border-danger/20 hover:bg-danger hover:text-white' : 'bg-success-soft text-success border-success/20 hover:bg-success hover:text-white'
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
        <div className="p-8 text-center text-text-muted">
          <Calendar className="w-12 h-12 text-border-subtle mx-auto mb-3" />
          <p className="text-sm">No test slots scheduled. Create your first slot!</p>
        </div>
      )}
    </div>
  );
}

function SlotForm({ slot, onClose }) {
  const [formData, setFormData] = useState({
    name: slot?.name || '',
    startAt: slot?.start_at ? new Date(slot.start_at).toISOString().slice(0, 16) : '',
    endAt: slot?.end_at ? new Date(slot.end_at).toISOString().slice(0, 16) : '',
    durationMinutes: slot?.duration_minutes || 30,
    isActive: slot?.is_active ? true : false,
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
    <div className="bg-surface rounded-[10px] border border-border-subtle shadow-sm p-[24px]">
      <h3 className="text-[18px] font-semibold text-text-primary tracking-tight mb-6">
        {slot?.id ? 'Edit Test Slot' : 'Create Test Slot'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Slot Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
            placeholder="Level 1A - Batch A"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.startAt}
              onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">End Time</label>
            <input
              type="datetime-local"
              value={formData.endAt}
              onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
            className="w-full px-3 h-[40px] bg-main border border-border-subtle text-text-primary rounded-lg focus:ring-1 focus:ring-accent focus:border-accent text-sm"
            min="1"
            required
          />
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-subtle">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-accent border-border-subtle rounded focus:ring-accent bg-main"
          />
          <label htmlFor="isActive" className="text-sm font-semibold text-text-primary">Set as Active Slot</label>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 h-[40px] bg-accent text-white rounded-[8px] hover:bg-accent/90 transition-colors disabled:opacity-50 text-xs font-bold uppercase tracking-wider"
          >
            {loading ? 'Saving...' : slot?.id ? 'Update Slot' : 'Create Slot'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 h-[40px] bg-main border border-border-subtle text-text-primary rounded-[8px] hover:bg-surface transition-colors text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
