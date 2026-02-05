import { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import { 
  fetchProblems, 
  createProblem, 
  updateProblem, 
  fetchTestCases, 
  createTestCase,
  deleteProblem,
  fetchLevels,
  uploadProblemReferenceImage,
  bulkImportProblems
} from '../../api/adminApi';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadLevels();
  }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      const data = await fetchProblems();
      setQuestions(data.problems || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLevels() {
    try {
      const data = await fetchLevels();
      setLevels(data.levels || []);
    } catch (err) {
      console.error('Failed to load levels:', err);
    }
  }

  function handleCreate() {
    setSelectedQuestion(null);
    setShowEditor(true);
  }

  function handleEdit(question) {
    setSelectedQuestion(question);
    setShowEditor(true);
  }

  async function handleDelete(question) {
    if (!question?.id) return;
    if (!confirm(`Delete question "${question.title}"? This will deactivate it.`)) {
      return;
    }

    try {
      await deleteProblem(question.id);
      await loadQuestions();
    } catch (err) {
      alert('Failed to delete question: ' + err.message);
    }
  }

  async function handleBulkImport() {
    if (!bulkFile) {
      alert('Choose a file first');
      return;
    }

    try {
      setBulkLoading(true);
      await bulkImportProblems(bulkFile);
      setBulkFile(null);
      await loadQuestions();
      alert('Bulk import completed');
    } catch (err) {
      alert('Bulk import failed: ' + err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
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
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Question
          </button>
        </div>
      </div>

      {showEditor ? (
        <QuestionEditor 
          question={selectedQuestion}
          levels={levels}
          onSave={(saved) => {
            setShowEditor(false);
            loadQuestions();
          }}
          onCancel={() => setShowEditor(false)}
        />
      ) : (
        <QuestionsTable 
          questions={questions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
    </div>
  );
}

function QuestionsTable({ questions, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {questions.map((q) => (
            <tr key={q.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-800">{q.id}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-800">{q.title}</div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Level {q.level}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  q.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {q.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(q)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(q)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {questions.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-500">No questions found. Create your first question!</p>
        </div>
      )}
    </div>
  );
}

function QuestionEditor({ question, levels, onSave, onCancel }) {
  const initialUiRequiredWidgets = (() => {
    const raw = question?.ui_required_widgets;
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.join('\n');
    } catch {}
    return raw;
  })();


  const [formData, setFormData] = useState({
    title: question?.title || '',
    description: question?.description || '',
    level: question?.level || '1A',
    starterCode: question?.starter_code || '',
    isActive: question?.is_active ?? true,
    referenceImageUrl: question?.reference_image_url || '',
    uiRequiredWidgets: initialUiRequiredWidgets,
  });

  const [testCases, setTestCases] = useState([]);
  const [testCaseForm, setTestCaseForm] = useState({ input: '', expectedOutput: '', isHidden: false, orderNo: 1 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (question?.id) {
      const levelMeta = levels?.find(lvl => lvl.level_code === (question?.level || ''));
      if (levelMeta?.assessment_type !== 'UI_COMPARE') {
        loadTestCases();
      }
    }
  }, [question, levels]);

  async function loadTestCases() {
    try {
      const cases = await fetchTestCases(question.id);
      setTestCases(cases.testCases || []);
    } catch (err) {
      console.error('Failed to load test cases:', err);
    }
  }

  async function handleSave() {
    try {
      setLoading(true);
      if (question?.id) {
        await updateProblem(question.id, formData);
      } else {
        await createProblem(formData);
      }
      onSave();
    } catch (err) {
      alert('Failed to save question: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTestCase() {
    if (!question?.id) {
      alert('Please save the question first before adding test cases');
      return;
    }

    try {
      await createTestCase(question.id, testCaseForm);
      setTestCaseForm({ input: '', expectedOutput: '', isHidden: false, orderNo: testCases.length + 1 });
      loadTestCases();
    } catch (err) {
      alert('Failed to add test case: ' + err.message);
    }
  }

  const sampleTestCases = testCases.filter(tc => !tc.is_hidden);
  const hiddenTestCases = testCases.filter(tc => tc.is_hidden);
  const selectedLevelMeta = levels?.find(lvl => lvl.level_code === formData.level);
  const isUiCompare = selectedLevelMeta?.assessment_type === 'UI_COMPARE';

  async function handleUploadReference() {
    if (!question?.id) {
      alert('Please save the question first before uploading the reference image');
      return;
    }

    if (!selectedImage) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      const res = await uploadProblemReferenceImage(question.id, selectedImage);
      setFormData(prev => ({ ...prev, referenceImageUrl: res.url }));
      setSelectedImage(null);
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  }



  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Question Metadata & Starter Code */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reverse a String"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write a function that reverses a string..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {levels?.length ? (
                    levels.map(level => (
                      <option key={level.level_code} value={level.level_code}>
                        Level {level.level_code}
                      </option>
                    ))
                  ) : (
                    <option value={formData.level}>Level {formData.level}</option>
                  )}
                </select>
              </div>

            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Starter Code</h3>
          <textarea
            value={formData.starterCode}
            onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="String reverseString(String input) {&#10;  // write your code here&#10;}"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : question?.id ? 'Update Question' : 'Save Question'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Right: Test Cases or UI Reference */}
      <div className="space-y-6">
        {isUiCompare ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">UI Reference Image</h3>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600"
              />
              <button
                onClick={handleUploadReference}
                disabled={uploading}
                className="px-4 py-2 rounded-md bg-blue-600 text-white"
              >
                {uploading ? 'Uploading...' : 'Upload Reference Image'}
              </button>
              {formData.referenceImageUrl && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs uppercase text-gray-500 mb-2">Preview</div>
                  <img
                    src={`${API_ORIGIN}${formData.referenceImageUrl}`}
                    alt="Reference preview"
                    className="max-h-80 w-full object-contain rounded-md"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Widgets (one per line)
                </label>
                <textarea
                  value={formData.uiRequiredWidgets}
                  onChange={(e) => setFormData({ ...formData, uiRequiredWidgets: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  placeholder="Scaffold\nAppBar\nListTile\nBottomNavigationBar"
                />
                <p className="text-xs text-gray-500 mt-2">
                  These are used for automated scoring for UI questions.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Cases</h3>

          {/* Sample Test Cases */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Sample Test Cases</h4>
              <span className="text-xs text-gray-500">Visible to students (2 required)</span>
            </div>
            <div className="space-y-2">
              {sampleTestCases.map((tc, idx) => (
                <TestCaseCard key={tc.id} testCase={tc} index={idx + 1} />
              ))}
              {sampleTestCases.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                  No sample test cases yet
                </p>
              )}
            </div>
          </div>

          {/* Hidden Test Cases */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Hidden Test Cases</h4>
              <span className="text-xs text-gray-500">Hidden from students (8 required)</span>
            </div>
            <div className="space-y-2">
              {hiddenTestCases.map((tc, idx) => (
                <TestCaseCard key={tc.id} testCase={tc} index={idx + 1} isHidden />
              ))}
              {hiddenTestCases.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                  No hidden test cases yet
                </p>
              )}
            </div>
          </div>

          {/* Add Test Case Form */}
          {question?.id && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Test Case</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Input</label>
                  <input
                    type="text"
                    value={testCaseForm.input}
                    onChange={(e) => setTestCaseForm({ ...testCaseForm, input: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    placeholder="hello"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                  <input
                    type="text"
                    value={testCaseForm.expectedOutput}
                    onChange={(e) => setTestCaseForm({ ...testCaseForm, expectedOutput: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                    placeholder="olleh"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={testCaseForm.isHidden}
                      onChange={(e) => setTestCaseForm({ ...testCaseForm, isHidden: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Hidden from students</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Order:</label>
                    <input
                      type="number"
                      value={testCaseForm.orderNo}
                      onChange={(e) => setTestCaseForm({ ...testCaseForm, orderNo: parseInt(e.target.value) })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddTestCase}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add Test Case
                </button>
              </div>
            </div>
          )}

          {!question?.id && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                Save the question first before adding test cases
              </p>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

function TestCaseCard({ testCase, index, isHidden }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600">TC #{index}</span>
            {isHidden && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Hidden</span>
            )}
          </div>
          <div className="space-y-1">
            <div>
              <span className="text-xs text-gray-500">Input:</span>
              <code className="ml-2 text-xs text-gray-800 font-mono">{testCase.input}</code>
            </div>
            <div>
              <span className="text-xs text-gray-500">Output:</span>
              <code className="ml-2 text-xs text-gray-800 font-mono">{testCase.expected_output}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
