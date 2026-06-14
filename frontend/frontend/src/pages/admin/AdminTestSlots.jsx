import { useState, useEffect } from 'react';
import { Plus, Edit, Calendar, Clock, Users, Search, Upload, Trash2, X } from 'lucide-react';
import { 
  fetchSchedules, 
  createSchedule, 
  updateSchedule,
  fetchTeachers,
  fetchStudents,
  fetchScheduleRegistrations,
  addScheduleRegistration,
  removeScheduleRegistration,
  bulkImportScheduleRegistrations,
} from '../../api/adminApi';

export default function AdminTestSlots() {
  const [slots, setSlots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentMatches, setStudentMatches] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [registrationFile, setRegistrationFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    loadSlots();
    loadTeachers();
  }, []);

  useEffect(() => {
    if (!selectedSlot) {
      setRegistrations([]);
      setStudentMatches([]);
      setStudentQuery('');
      setRegistrationFile(null);
      return;
    }

    loadRegistrations(selectedSlot.id);
  }, [selectedSlot]);

  useEffect(() => {
    if (!selectedSlot) {
      return;
    }

    const trimmedQuery = studentQuery.trim();
    if (!trimmedQuery) {
      setStudentMatches([]);
      setStudentSearchLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      loadStudentMatches(trimmedQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [studentQuery, selectedSlot]);

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

  async function loadRegistrations(slotId) {
    try {
      setRegistrationLoading(true);
      const data = await fetchScheduleRegistrations(slotId);
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error('Failed to load slot registrations:', err);
    } finally {
      setRegistrationLoading(false);
    }
  }

  async function loadStudentMatches(query) {
    try {
      setStudentSearchLoading(true);
      const data = await fetchStudents(query);
      setStudentMatches(data.students || []);
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setStudentSearchLoading(false);
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

  function handleManageRegistrations(slot) {
    setSelectedSlot(slot);
  }

  async function handleAddRegistration(user) {
    if (!selectedSlot) return;

    try {
      setRegistrationLoading(true);
      await addScheduleRegistration(selectedSlot.id, { userId: user.id, source: 'UI' });
      await loadRegistrations(selectedSlot.id);
      await loadSlots();
    } catch (err) {
      alert('Failed to add student: ' + err.message);
    } finally {
      setRegistrationLoading(false);
    }
  }

  async function handleRemoveRegistration(userId) {
    if (!selectedSlot) return;

    try {
      setRegistrationLoading(true);
      await removeScheduleRegistration(selectedSlot.id, userId);
      await loadRegistrations(selectedSlot.id);
      await loadSlots();
    } catch (err) {
      alert('Failed to remove student: ' + err.message);
    } finally {
      setRegistrationLoading(false);
    }
  }

  async function handleImportRegistrations() {
    if (!selectedSlot) return;
    if (!registrationFile) {
      alert('Choose an Excel file first');
      return;
    }

    try {
      setImportLoading(true);
      await bulkImportScheduleRegistrations(selectedSlot.id, registrationFile);
      setRegistrationFile(null);
      await loadRegistrations(selectedSlot.id);
      await loadSlots();
      alert('Slot import completed');
    } catch (err) {
      alert('Slot import failed: ' + err.message);
    } finally {
      setImportLoading(false);
    }
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
          onManageRegistrations={handleManageRegistrations}
          loading={loading}
        />

      {selectedSlot && (
        <SlotRegistrationPanel
          slot={selectedSlot}
          registrations={registrations}
          registrationLoading={registrationLoading}
          studentQuery={studentQuery}
          setStudentQuery={setStudentQuery}
          studentMatches={studentMatches}
          studentSearchLoading={studentSearchLoading}
          registrationFile={registrationFile}
          setRegistrationFile={setRegistrationFile}
          onAddRegistration={handleAddRegistration}
          onRemoveRegistration={handleRemoveRegistration}
          onImportRegistrations={handleImportRegistrations}
          onClose={() => setSelectedSlot(null)}
          importLoading={importLoading}
        />
      )}
    </div>
  );
}

function SlotsTable({ slots, onEdit, onToggleActive, onManageRegistrations, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading test slots...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-[1200px] w-full">
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
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
                <td className="px-6 py-4 text-sm text-gray-600">
                  {slot.registration_count || 0}
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
                    <button
                      onClick={() => onManageRegistrations(slot)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors text-sm"
                    >
                      <Users className="w-4 h-4" />
                      Students
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

function SlotRegistrationPanel({
  slot,
  registrations,
  registrationLoading,
  studentQuery,
  setStudentQuery,
  studentMatches,
  studentSearchLoading,
  registrationFile,
  setRegistrationFile,
  onAddRegistration,
  onRemoveRegistration,
  onImportRegistrations,
  onClose,
  importLoading,
}) {
  const registeredIds = new Set(registrations.map((registration) => registration.user_id));
  const candidateStudents = studentMatches.filter((student) => !registeredIds.has(student.id));
  const hasQuery = Boolean(studentQuery.trim());

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Slot Students</h3>
          <p className="text-sm text-gray-500">Manage registrations for {slot.name || `Slot ${slot.id}`}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search students</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search by name, email, enrollment or roll no"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="text-sm font-medium text-gray-700">Available students</div>
            </div>
            <div className="max-h-80 overflow-auto divide-y divide-gray-200">
              {!hasQuery ? (
                <div className="p-4 text-sm text-gray-500">Type a name, email, enrollment, or roll number to search.</div>
              ) : studentSearchLoading ? (
                <div className="p-4 text-sm text-gray-500">Searching students...</div>
              ) : candidateStudents.length ? (
                candidateStudents.map((student) => (
                  <div key={student.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{student.full_name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                      <div className="text-xs text-gray-400">
                        {student.enrollment_no || 'No enrollment'} {student.roll_no ? `• ${student.roll_no}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddRegistration(student)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-500">No matching students found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Registered students</div>
              <div className="text-xs text-gray-500">{registrations.length} registered</div>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)}
              />
              <Upload className="w-4 h-4" />
              {registrationFile ? registrationFile.name : 'Import Excel'}
            </label>
          </div>

          <button
            type="button"
            onClick={onImportRegistrations}
            disabled={importLoading || !registrationFile}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {importLoading ? 'Importing...' : 'Upload registrations'}
          </button>

          <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/60 px-4 py-3 text-xs text-gray-600 space-y-1">
            <div className="font-medium text-gray-700">Excel format</div>
            <div>Use one header row, then one student per row.</div>
            <div>Accepted columns: user_id, email, enrollment_no, roll_no, full_name.</div>
            <div>Matching priority: user_id, email, enrollment_no, roll_no, full_name.</div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="max-h-80 overflow-auto divide-y divide-gray-200">
              {registrationLoading ? (
                <div className="p-4 text-sm text-gray-500">Loading registrations...</div>
              ) : registrations.length ? (
                registrations.map((registration) => (
                  <div key={registration.user_id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{registration.full_name}</div>
                      <div className="text-xs text-gray-500">{registration.email}</div>
                      <div className="text-xs text-gray-400">Source: {registration.source || 'UI'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveRegistration(registration.user_id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-gray-500">No students registered for this slot yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to format date for datetime-local input in local timezone
function formatLocalDateTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function SlotForm({ slot, onClose, teachers }) {
  const [formData, setFormData] = useState({
    name: slot?.name || '',
    startAt: formatLocalDateTime(slot?.start_at),
    endAt: formatLocalDateTime(slot?.end_at),
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
      // Convert datetime-local strings to ISO format with timezone
      const dataToSend = {
        ...formData,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : formData.startAt,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : formData.endAt,
      };
      if (slot?.id) {
        await updateSchedule(slot.id, dataToSend);
      } else {
        await createSchedule(dataToSend);
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
          <TeacherSearchSelect
            label="Live Test Teacher"
            value={formData.liveTeacherId}
            onChange={(teacherId) => setFormData({ ...formData, liveTeacherId: teacherId })}
            teachers={teachers}
            placeholder="Search live teacher"
          />
          <TeacherSearchSelect
            label="Code Review Teacher"
            value={formData.codeReviewerId}
            onChange={(teacherId) => setFormData({ ...formData, codeReviewerId: teacherId })}
            teachers={teachers}
            placeholder="Search code reviewer"
          />
          <TeacherSearchSelect
            label="UI Review Teacher"
            value={formData.uiReviewerId}
            onChange={(teacherId) => setFormData({ ...formData, uiReviewerId: teacherId })}
            teachers={teachers}
            placeholder="Search UI reviewer"
          />
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

function TeacherSearchSelect({ label, value, onChange, teachers, placeholder }) {
  const [query, setQuery] = useState('');
  const selectedTeacher = teachers.find((teacher) => String(teacher.id) === String(value));

  const filteredTeachers = teachers.filter((teacher) => {
    const searchValue = `${teacher.full_name || ''} ${teacher.email || ''} ${teacher.staff_id || ''}`.toLowerCase();
    return searchValue.includes(query.trim().toLowerCase());
  });

  function handleSelect(teacherId) {
    onChange(teacherId);
    const nextTeacher = teachers.find((teacher) => String(teacher.id) === String(teacherId));
    setQuery(nextTeacher ? `${nextTeacher.full_name} ${nextTeacher.email || ''}`.trim() : '');
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            placeholder={placeholder}
          />
        </div>

        <div className="max-h-44 overflow-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-200">
          {filteredTeachers.length ? (
            filteredTeachers.slice(0, 12).map((teacher) => (
              <button
                key={teacher.id}
                type="button"
                onClick={() => handleSelect(teacher.id)}
                className={`w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors ${String(value) === String(teacher.id) ? 'bg-purple-50' : ''}`}
              >
                <div className="text-sm font-medium text-gray-800">{teacher.full_name}</div>
                <div className="text-xs text-gray-500">{teacher.email}</div>
                <div className="text-[11px] text-gray-400">{teacher.staff_id || 'No staff ID'}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500">No matching staff found.</div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {selectedTeacher ? (
            <span>Selected: {selectedTeacher.full_name}</span>
          ) : (
            <span>Search by name, email, or staff ID.</span>
          )}
        </div>
      </div>
    </div>
  );
}
