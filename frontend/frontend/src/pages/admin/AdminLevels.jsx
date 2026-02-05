import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { fetchLevels, createLevel, updateLevel } from "../../api/adminApi";

const TYPE_OPTIONS = [
  { value: "TEST_CASE", label: "Test Case" },
  { value: "UI_COMPARE", label: "UI Compare" },
];

export default function AdminLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newLevel, setNewLevel] = useState({
    levelCode: "",
    assessmentType: "TEST_CASE",
    questionCount: 2,
    durationMinutes: 60,
    passThreshold: 85,
    isActive: true,
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
      });
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
        <div className="grid grid-cols-6 gap-3">
          <input
            value={newLevel.levelCode}
            onChange={e => setNewLevel({ ...newLevel, levelCode: e.target.value })}
            className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="1B"
          />
          <select
            value={newLevel.assessmentType}
            onChange={e => setNewLevel({ ...newLevel, assessmentType: e.target.value })}
            className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg"
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={newLevel.questionCount}
            onChange={e => setNewLevel({ ...newLevel, questionCount: Number(e.target.value) })}
            className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Questions"
          />
          <input
            type="number"
            value={newLevel.durationMinutes}
            onChange={e => setNewLevel({ ...newLevel, durationMinutes: Number(e.target.value) })}
            className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Minutes"
          />
          <input
            type="number"
            value={newLevel.passThreshold}
            onChange={e => setNewLevel({ ...newLevel, passThreshold: Number(e.target.value) })}
            className="col-span-1 px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Pass %"
          />
          <button
            onClick={handleCreate}
            className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
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
                  <button
                    onClick={() => handleUpdate(level)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {levels.length === 0 && !loading && (
          <div className="p-6 text-sm text-gray-500">No levels configured.</div>
        )}
      </div>
    </div>
  );
}
