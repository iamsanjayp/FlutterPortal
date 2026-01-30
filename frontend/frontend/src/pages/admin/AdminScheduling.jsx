import { useEffect, useMemo, useState } from "react";
import { fetchSchedules, createSchedule, updateSchedule } from "../../api/adminApi";

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
        startAt: form.startAt,
        endAt: form.endAt,
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
        startAt: form.startAt || null,
        endAt: form.endAt || null,
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

      <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Scheduling</h2>
            <p className="text-sm text-slate-400">Create and update test sessions.</p>
          </div>
          <button
            onClick={() => setShowForm(prev => !prev)}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm"
          >
            {showForm ? "Close" : "Create Session"}
          </button>
        </div>

        {showForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs uppercase text-slate-400">Select Session to Edit</label>
              <select
                value={selectedId}
                onChange={event => setSelectedId(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
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
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Session name"
                />
                <input
                  value={form.durationMinutes}
                  onChange={event => setForm({ ...form, durationMinutes: event.target.value })}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Duration (minutes)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={event => setForm({ ...form, startAt: event.target.value })}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={event => setForm({ ...form, endAt: event.target.value })}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={event => setForm({ ...form, isActive: event.target.checked })}
                />
                Active session
              </label>

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm shadow-sm"
                >
                  Create
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-100 text-sm shadow-sm"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="text-xs uppercase text-slate-400">Previous Sessions</div>
          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-100">{schedule.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(schedule.start_at).toLocaleString()} - {new Date(schedule.end_at).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Duration: {schedule.duration_minutes || "Default"} mins</div>
                <div className="text-xs text-slate-400">Status: {schedule.is_active ? "Active" : "Inactive"}</div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setSelectedId(String(schedule.id));
                  setForm({
                    name: schedule.name || "",
                    startAt: schedule.start_at ? new Date(schedule.start_at).toISOString().slice(0, 16) : "",
                    endAt: schedule.end_at ? new Date(schedule.end_at).toISOString().slice(0, 16) : "",
                    durationMinutes: schedule.duration_minutes || "",
                    isActive: Boolean(schedule.is_active),
                  });
                }}
                className="px-3 py-2 rounded-xl border border-slate-700 text-slate-100 text-xs"
              >
                Edit
              </button>
            </div>
          ))}
          {!schedules.length && (
            <div className="text-sm text-slate-400">No sessions yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
