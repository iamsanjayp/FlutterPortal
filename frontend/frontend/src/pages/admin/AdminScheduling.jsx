import { useEffect, useMemo, useState } from "react";
import { fetchSchedules, createSchedule, updateSchedule } from "../../api/adminApi";

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

export default function AdminScheduling() {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startAt: "",
    endAt: "",
    durationMinutes: "",
    isActive: false,
  });
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const options = useMemo(
    () =>
      schedules.map(schedule => ({
        value: String(schedule.id),
        label: `${schedule.name} (${new Date(schedule.start_at).toLocaleString()} - ${new Date(schedule.end_at).toLocaleString()})`,
      })),
    [schedules]
  );

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      const res = await fetchSchedules();
      setSchedules(res.schedules || []);
    } catch (err) {
      setError(err.message || "Failed to load schedules");
    }
  }

  function pushNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  }

  async function handleCreate() {
    setError("");
    try {
      await createSchedule({
        name: form.name,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : form.startAt,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : form.endAt,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        isActive: form.isActive,
      });
      pushNotice("Schedule created");
      loadSchedules();
    } catch (err) {
      setError(err.message || "Failed to create schedule");
    }
  }

  async function handleUpdate() {
    if (!selectedId) return;
    setError("");
    try {
      await updateSchedule(selectedId, {
        name: form.name || null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        isActive: form.isActive,
      });
      pushNotice("Schedule updated");
      loadSchedules();
    } catch (err) {
      setError(err.message || "Failed to update schedule");
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {notice && <div className="text-sm text-emerald-600">{notice}</div>}

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Scheduling</h2>
            <p className="text-sm text-slate-500">Create and update test sessions.</p>
          </div>
          <button
            onClick={() => setShowForm(prev => !prev)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
          >
            {showForm ? "Close" : "Create Session"}
          </button>
        </div>

        {showForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Session to Edit</label>
              <select
                value={selectedId}
                onChange={event => setSelectedId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select</option>
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  placeholder="Session name"
                />
                <input
                  value={form.durationMinutes}
                  onChange={event => setForm({ ...form, durationMinutes: event.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  placeholder="Duration (minutes)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={event => setForm({ ...form, startAt: event.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={event => setForm({ ...form, endAt: event.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={event => setForm({ ...form, isActive: event.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Active session
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
                >
                  Create
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-sm transition"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Previous Sessions</div>
          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">{schedule.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(schedule.start_at).toLocaleString()} - {new Date(schedule.end_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-600 mt-1">Duration: {schedule.duration_minutes || "Default"} mins</div>
                <div className="text-xs text-slate-600">Status: <span className={schedule.is_active ? "text-emerald-600 font-semibold" : "text-slate-500 font-semibold"}>{schedule.is_active ? "Active" : "Inactive"}</span></div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setSelectedId(String(schedule.id));
                  setForm({
                    name: schedule.name || "",
                    startAt: schedule.start_at ? formatLocalDateTime(schedule.start_at) : "",
                    endAt: schedule.end_at ? formatLocalDateTime(schedule.end_at) : "",
                    durationMinutes: schedule.duration_minutes || "",
                    isActive: Boolean(schedule.is_active),
                  });
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition"
              >
                Edit
              </button>
            </div>
          ))}
          {!schedules.length && (
            <div className="text-sm text-slate-500">No sessions yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
