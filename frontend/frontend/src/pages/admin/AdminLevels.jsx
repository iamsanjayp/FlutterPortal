import { useEffect, useState } from "react";
import { Plus, Save, Edit3, X } from "lucide-react";
import { fetchLevels, createLevel, updateLevel } from "../../api/adminApi";

const TYPE_OPTIONS = [
  { value: "TEST_CASE", label: "Test Case" },
  { value: "UI_COMPARE", label: "UI Compare" },
];

export default function AdminLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingLevel, setEditingLevel] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [newLevel, setNewLevel] = useState({
    levelCode: "",
    assessmentType: "TEST_CASE",
    questionCount: 2,
    durationMinutes: 60,
    passThreshold: 85,
    isActive: true,
    studentOverview: "",
    portionsText: "",
    resourceLinksText: "",
  });

  useEffect(() => {
    loadLevels();
  }, []);

  async function loadLevels() {
    try {
      setLoading(true);
      const data = await fetchLevels();
      setLevels(data.levels || []);
    } catch (err) {
      setError(err.message || "Failed to load levels");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setError("");
    try {
      await createLevel(newLevel);
      setNewLevel({
        levelCode: "",
        assessmentType: "TEST_CASE",
        questionCount: 2,
        durationMinutes: 60,
        passThreshold: 85,
        isActive: true,
        studentOverview: "",
        portionsText: "",
        resourceLinksText: "",
      });
      loadLevels();
    } catch (err) {
      setError(err.message || "Failed to create level");
    }
  }

  async function handleUpdate(level) {
    setError("");
    try {
      await updateLevel(level.level_code, {
        assessmentType: level.assessment_type,
        questionCount: level.question_count,
        durationMinutes: level.duration_minutes,
        passThreshold: level.pass_threshold,
        isActive: level.is_active === 1,
        studentOverview: level.student_overview || "",
        portionsText: level.portions_text || "",
        resourceLinksText: level.resource_links_text || "",
      });
      loadLevels();
    } catch (err) {
      setError(err.message || "Failed to update level");
    }
  }

  function openEdit(level) {
    setEditingLevel(level);
    setEditForm({
      assessmentType: level.assessment_type,
      questionCount: level.question_count,
      durationMinutes: level.duration_minutes,
      passThreshold: level.pass_threshold,
      isActive: level.is_active === 1,
      studentOverview: level.student_overview || "",
      portionsText: level.portions_text || "",
      resourceLinksText: level.resource_links_text || "",
    });
  }

  async function handleSaveEdit() {
    if (!editingLevel || !editForm) return;
    try {
      setError("");
      await updateLevel(editingLevel.level_code, editForm);
      setEditingLevel(null);
      setEditForm(null);
      loadLevels();
    } catch (err) {
      setError(err.message || "Failed to update level");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Level Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage assessment type and timing per level</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            value={newLevel.levelCode}
            onChange={e => setNewLevel({ ...newLevel, levelCode: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="1B"
          />
          <select
            value={newLevel.assessmentType}
            onChange={e => setNewLevel({ ...newLevel, assessmentType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={newLevel.questionCount}
            onChange={e => setNewLevel({ ...newLevel, questionCount: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Questions"
          />
          <input
            type="number"
            value={newLevel.durationMinutes}
            onChange={e => setNewLevel({ ...newLevel, durationMinutes: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Minutes"
          />
          <input
            type="number"
            value={newLevel.passThreshold}
            onChange={e => setNewLevel({ ...newLevel, passThreshold: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Pass %"
          />
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <textarea
            value={newLevel.studentOverview}
            onChange={(e) => setNewLevel({ ...newLevel, studentOverview: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-24"
            placeholder="Student overview shown on the dashboard"
          />
          <textarea
            value={newLevel.portionsText}
            onChange={(e) => setNewLevel({ ...newLevel, portionsText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-24"
            placeholder="Portions, one per line"
          />
          <textarea
            value={newLevel.resourceLinksText}
            onChange={(e) => setNewLevel({ ...newLevel, resourceLinksText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-24"
            placeholder="Resources, one per line as Label | URL"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dashboard Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {levels.map(level => (
              <tr key={level.level_code}>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{level.level_code}</td>
                <td className="px-6 py-4">
                  <select
                    value={level.assessment_type}
                    onChange={e => {
                      const next = levels.map(item =>
                        item.level_code === level.level_code
                          ? { ...item, assessment_type: e.target.value }
                          : item
                      );
                      setLevels(next);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    {TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={level.question_count}
                    onChange={e => {
                      const next = levels.map(item =>
                        item.level_code === level.level_code
                          ? { ...item, question_count: Number(e.target.value) }
                          : item
                      );
                      setLevels(next);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={level.duration_minutes}
                    onChange={e => {
                      const next = levels.map(item =>
                        item.level_code === level.level_code
                          ? { ...item, duration_minutes: Number(e.target.value) }
                          : item
                      );
                      setLevels(next);
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={level.pass_threshold}
                    onChange={e => {
                      const next = levels.map(item =>
                        item.level_code === level.level_code
                          ? { ...item, pass_threshold: Number(e.target.value) }
                          : item
                      );
                      setLevels(next);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="space-y-1">
                    <div>{level.student_overview ? 'Overview set' : 'No overview'}</div>
                    <div className="text-xs text-gray-400">
                      {(level.portions_text || '').split(/\r?\n/).filter(Boolean).length} portions · {(level.resource_links_text || '').split(/\r?\n/).filter(Boolean).length} resources
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={level.is_active === 1}
                    onChange={e => {
                      const next = levels.map(item =>
                        item.level_code === level.level_code
                          ? { ...item, is_active: e.target.checked ? 1 : 0 }
                          : item
                      );
                      setLevels(next);
                    }}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(level)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 transition-colors text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      Details
                    </button>
                    <button
                      onClick={() => handleUpdate(level)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {levels.length === 0 && !loading && (
          <div className="p-6 text-sm text-gray-500">No levels configured.</div>
        )}
      </div>

      {editingLevel && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit Level Content</h3>
                <p className="text-sm text-gray-500">{editingLevel.level_code}</p>
              </div>
              <button onClick={() => { setEditingLevel(null); setEditForm(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Assessment Type</span>
                <select
                  value={editForm.assessmentType}
                  onChange={(e) => setEditForm({ ...editForm, assessmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Pass Threshold</span>
                <input
                  type="number"
                  value={editForm.passThreshold}
                  onChange={(e) => setEditForm({ ...editForm, passThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Questions</span>
                <input
                  type="number"
                  value={editForm.questionCount}
                  onChange={(e) => setEditForm({ ...editForm, questionCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Duration (minutes)</span>
                <input
                  type="number"
                  value={editForm.durationMinutes}
                  onChange={(e) => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <label className="space-y-1 block">
                <span className="text-sm font-medium text-gray-700">Student Overview</span>
                <textarea
                  value={editForm.studentOverview}
                  onChange={(e) => setEditForm({ ...editForm, studentOverview: e.target.value })}
                  className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm font-medium text-gray-700">Portions</span>
                <textarea
                  value={editForm.portionsText}
                  onChange={(e) => setEditForm({ ...editForm, portionsText: e.target.value })}
                  className="w-full min-h-28 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="One portion per line"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm font-medium text-gray-700">Resource Links</span>
                <textarea
                  value={editForm.resourceLinksText}
                  onChange={(e) => setEditForm({ ...editForm, resourceLinksText: e.target.value })}
                  className="w-full min-h-28 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Label | URL, one per line"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                Active level
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setEditingLevel(null); setEditForm(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
