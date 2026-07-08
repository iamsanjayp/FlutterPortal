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
  uploadProblemResources,
  deleteProblemResource,
  bulkImportProblems
} from '../../api/adminApi';
import { API_BASE_ROOT } from '../../api/apiBase.js';

const API_ORIGIN = API_BASE_ROOT;

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
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${q.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
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

const AVAILABLE_PACKAGES = [
  { id: 'provider', label: 'Provider (^6.1.1)' },
  { id: 'flutter_riverpod', label: 'Riverpod (^2.5.1)' },
  { id: 'flutter_bloc', label: 'BLoC (^8.1.3)' },
  { id: 'dio', label: 'Dio (^5.4.0)' },
  { id: 'http', label: 'HTTP (^1.1.0)' },
  { id: 'sqflite_common_ffi_web', label: 'SQLite Web (^0.4.3)' },
  { id: 'shared_preferences', label: 'Shared Preferences (^2.2.2)' },
  { id: 'get_it', label: 'GetIt (^7.6.0)' },
  { id: 'equatable', label: 'Equatable (^2.0.5)' }
];

function QuestionEditor({ question, levels, onSave, onCancel }) {
  const initialUiRequiredWidgets = (() => {
    const raw = question?.ui_required_widgets;
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.join('\n');
    } catch { }
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
    resourceUrls: (() => {
      try {
        const parsed = JSON.parse(question?.resource_urls || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    })(),
    requiredPackages: (() => {
      try {
        const parsed = JSON.parse(question?.required_packages || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return typeof question?.required_packages === 'string' ? question.required_packages.split(',').map(s=>s.trim()).filter(Boolean) : [];
      }
    })(),
    mockApiRoute: question?.mock_api_route || '',
    mockApiResponse: question?.mock_api_response || '',
    mockDbSeed: question?.mock_db_seed || '',
    customTestCode: question?.custom_test_code || '',
  });

  // Multi-file workspace state
  const [isMultiFile, setIsMultiFile] = useState(() => {
    if (question?.project_files) {
      try {
        const parsed = JSON.parse(question.project_files);
        return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0;
      } catch { }
    }
    return false;
  });

  const [projectFilesMap, setProjectFilesMap] = useState(() => {
    if (question?.project_files) {
      try {
        const parsed = JSON.parse(question.project_files);
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) return parsed;
      } catch { }
    }
    return { "lib/main.dart": question?.starter_code || "// Write your Flutter code here\n" };
  });

  const [activeFilePath, setActiveFilePath] = useState("lib/main.dart");
  const [newFileName, setNewFileName] = useState("");
  const [showAddFileModal, setShowAddFileModal] = useState(false);

  // Tab states for LeetCode style dynamic layout
  const [leftTab, setLeftTab] = useState('details'); // 'details' | 'packages_mock' | 'grading'
  const [rightTab, setRightTab] = useState('code'); // 'code' | 'testcases' | 'resources'

  const [testCases, setTestCases] = useState([]);
  const [testCaseForm, setTestCaseForm] = useState({ input: '', expectedOutput: '', isHidden: false, orderNo: 1 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (question?.id) {
      const levelMeta = levels?.find(lvl => lvl.level_code === (question?.level || ''));
      if (levelMeta?.assessment_type !== 'UI_COMPARE' && levelMeta?.assessment_type !== 'FLUTTER_UI') {
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
      const payload = {
        ...formData,
        projectFiles: isMultiFile ? JSON.stringify(projectFilesMap) : null,
        starterCode: isMultiFile ? (projectFilesMap["lib/main.dart"] || Object.values(projectFilesMap)[0] || "") : formData.starterCode,
        requiredPackages: JSON.stringify(formData.requiredPackages),
      };
      if (question?.id) {
        await updateProblem(question.id, payload);
      } else {
        await createProblem(payload);
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
  const isUiCompare = selectedLevelMeta?.assessment_type === 'UI_COMPARE' || selectedLevelMeta?.assessment_type === 'FLUTTER_UI';

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

  async function handleUploadResources(e) {
    if (!question?.id) {
      alert('Please save the question first before uploading resources');
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const res = await uploadProblemResources(question.id, files);
      setFormData(prev => ({ ...prev, resourceUrls: res.resourceUrls }));
      e.target.value = '';
    } catch (err) {
      alert('Failed to upload resources: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteResource(url) {
    if (!confirm('Delete this resource?')) return;
    try {
      const res = await deleteProblemResource(question.id, url);
      setFormData(prev => ({ ...prev, resourceUrls: res.resourceUrls }));
    } catch (err) {
      alert('Failed to delete resource: ' + err.message);
    }
  }

  function handleAddFile() {
    if (!newFileName.trim()) return;
    let name = newFileName.trim().replace(/\\/g, '/');
    if (!name.startsWith('lib/') && !name.startsWith('test/') && name !== 'pubspec.yaml') {
      name = 'lib/' + name;
    }
    if (projectFilesMap[name] !== undefined) {
      alert('File already exists');
      return;
    }
    setProjectFilesMap(prev => ({ ...prev, [name]: '// New file: ' + name + '\n' }));
    setActiveFilePath(name);
    setNewFileName('');
    setShowAddFileModal(false);
  }

  function handleDeleteFile(pathToDelete) {
    if (Object.keys(projectFilesMap).length <= 1) {
      alert('You must have at least one file in the workspace.');
      return;
    }
    if (!confirm(`Delete ${pathToDelete}?`)) return;
    const nextMap = { ...projectFilesMap };
    delete nextMap[pathToDelete];
    setProjectFilesMap(nextMap);
    if (activeFilePath === pathToDelete) {
      setActiveFilePath(Object.keys(nextMap)[0]);
    }
  }

  function togglePackage(pkgId) {
    setFormData(prev => {
      const exists = prev.requiredPackages.includes(pkgId);
      return {
        ...prev,
        requiredPackages: exists ? prev.requiredPackages.filter(p => p !== pkgId) : [...prev.requiredPackages, pkgId]
      };
    });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[750px]">
      {/* Left Column: LeetCode-style dynamic specification & configuration panel */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Left Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setLeftTab('details')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              leftTab === 'details' ? 'bg-white text-purple-600 border-t-2 border-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            General Details
          </button>
          <button
            onClick={() => setLeftTab('packages_mock')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              leftTab === 'packages_mock' ? 'bg-white text-purple-600 border-t-2 border-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>Packages & Mocks</span>
            {formData.requiredPackages.length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {formData.requiredPackages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setLeftTab('grading')}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
              leftTab === 'grading' ? 'bg-white text-purple-600 border-t-2 border-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Grading & Assertions
          </button>
        </div>

        {/* Left Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {leftTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Question Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g. Build an Interactive Shopping Cart"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Curriculum Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                  >
                    {levels?.length ? (
                      levels.map(lvl => (
                        <option key={lvl.level_code} value={lvl.level_code}>
                          Level {lvl.level_code} - {lvl.title || lvl.assessment_type}
                        </option>
                      ))
                    ) : (
                      <option value={formData.level}>Level {formData.level}</option>
                    )}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active in Question Bank</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Problem Description & Instructions</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm leading-relaxed"
                  placeholder="Provide clear Markdown instructions, goals, and requirements for the student..."
                />
              </div>
            </div>
          )}

          {leftTab === 'packages_mock' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-purple-900 mb-1">Dynamic Package Selector (Levels 2C–3C+)</h4>
                <p className="text-xs text-purple-700 mb-3">
                  Check any third-party Flutter/Dart packages required for this problem. These will be automatically injected into <code>pubspec.yaml</code> during compilation.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_PACKAGES.map(pkg => (
                    <label key={pkg.id} className="flex items-center gap-2 bg-white p-2 rounded border border-purple-100 hover:border-purple-300 cursor-pointer shadow-2xs transition-all">
                      <input
                        type="checkbox"
                        checked={formData.requiredPackages.includes(pkg.id)}
                        onChange={() => togglePackage(pkg.id)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-xs font-mono font-medium text-gray-800">{pkg.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Mock Backend API & Storage Configuration</h4>
                <p className="text-xs text-gray-500">
                  Configure simulated REST endpoints and SQLite database seeders for Level 3C, 5, and 6 networking/storage tasks.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mock API Route Subpath</label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-xs font-mono">
                      /api/mock/{question?.id || 'id'}/
                    </span>
                    <input
                      type="text"
                      value={formData.mockApiRoute}
                      onChange={(e) => setFormData({ ...formData, mockApiRoute: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 text-xs font-mono"
                      placeholder="items  or  users/login"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mock API Response Body (JSON / Text)</label>
                  <textarea
                    value={formData.mockApiResponse}
                    onChange={(e) => setFormData({ ...formData, mockApiResponse: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    placeholder='[{"id": 1, "name": "MacBook Pro", "price": 1999}, {"id": 2, "name": "iPhone 15", "price": 999}]'
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mock SQLite Database Seeder (JSON Rows / SQL)</label>
                  <textarea
                    value={formData.mockDbSeed}
                    onChange={(e) => setFormData({ ...formData, mockDbSeed: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    placeholder='{"table": "todos", "rows": [{"id": 1, "task": "Learn Riverpod", "done": 0}]}'
                  />
                </div>
              </div>
            </div>
          )}

          {leftTab === 'grading' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  Required Widgets (Automated UI Scoring)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  List widget class names (one per line) that must appear in the student's UI hierarchy.
                </p>
                <textarea
                  value={formData.uiRequiredWidgets}
                  onChange={(e) => setFormData({ ...formData, uiRequiredWidgets: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs font-mono"
                  placeholder="Scaffold&#10;AppBar&#10;ListView&#10;FloatingActionButton"
                />
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-gray-800">
                    Custom Test Assertions (`test/solution_test.dart`)
                  </label>
                  <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    Advanced Interactive Grading
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Write Dart/Flutter test suite code to verify widget state transitions, button taps, controllers, or navigation. Leave blank to use default automated grading.
                </p>
                <textarea
                  value={formData.customTestCode}
                  onChange={(e) => setFormData({ ...formData, customTestCode: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-xs font-mono bg-slate-50 text-slate-800 shadow-inner"
                  placeholder="import 'package:flutter_test/flutter_test.dart';&#10;import '../lib/solution.dart';&#10;&#10;void main() {&#10;  testWidgets('Verify counter increments on button tap', (tester) async {&#10;    await tester.pumpWidget(MaterialApp(home: buildUI()));&#10;    expect(find.text('0'), findsOneWidget);&#10;    await tester.tap(find.byType(FloatingActionButton));&#10;    await tester.pump();&#10;    expect(find.text('1'), findsOneWidget);&#10;  });&#10;}"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving Question...' : question?.id ? 'Update Question' : 'Create Question'}
          </button>
          <button
            onClick={onCancel}
            className="py-2.5 px-5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Right Column: LeetCode-style dynamic IDE Workspace & Test Cases */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Right Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-3 gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setRightTab('code')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                rightTab === 'code' ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>Code Workspace</span>
              {isMultiFile && (
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {Object.keys(projectFilesMap).length} files
                </span>
              )}
            </button>
            <button
              onClick={() => setRightTab('testcases')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                rightTab === 'testcases' ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Test Cases ({testCases.length})
            </button>
            <button
              onClick={() => setRightTab('resources')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                rightTab === 'resources' ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Design & Assets
            </button>
          </div>

          <div className="pb-1">
            <button
              onClick={() => {
                if (!isMultiFile) {
                  setIsMultiFile(true);
                  setProjectFilesMap({ "lib/main.dart": formData.starterCode || "// Write code here\n" });
                } else {
                  if (confirm("Switch to Single File mode? Only lib/main.dart will be kept.")) {
                    setIsMultiFile(false);
                    setFormData(prev => ({ ...prev, starterCode: projectFilesMap["lib/main.dart"] || "" }));
                  }
                }
              }}
              className="text-xs font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {isMultiFile ? "Switch to Single File" : "Enable Multi-File Project"}
            </button>
          </div>
        </div>

        {/* Right Tab Content */}
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          {rightTab === 'code' && (
            <div className="flex-1 flex flex-col animate-fadeIn space-y-3">
              {isMultiFile ? (
                <div className="flex-1 flex flex-col space-y-3">
                  {/* Multi-File Tab Bar */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.keys(projectFilesMap).map(filePath => (
                        <div
                          key={filePath}
                          onClick={() => setActiveFilePath(filePath)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer border transition-all ${
                            activeFilePath === filePath
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span>{filePath}</span>
                          {Object.keys(projectFilesMap).length > 1 && (
                            <span
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(filePath); }}
                              className="hover:text-red-300 font-bold ml-1"
                              title="Delete File"
                            >
                              ✕
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAddFileModal(true)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add File
                    </button>
                  </div>

                  {/* Add File Modal / Input Inline */}
                  {showAddFileModal && (
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="e.g. lib/models/user.dart or lib/widgets/navbar.dart"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        autoFocus
                      />
                      <button
                        onClick={handleAddFile}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowAddFileModal(false)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Editor for Active File */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center bg-slate-100 text-slate-700 border border-slate-200 border-b-0 px-3 py-2 rounded-t-lg text-xs font-mono font-semibold">
                      <span>{activeFilePath}</span>
                      <span className="text-slate-500 font-sans">Dart / Flutter Workspace</span>
                    </div>
                    <textarea
                      value={projectFilesMap[activeFilePath] || ""}
                      onChange={(e) => setProjectFilesMap({ ...projectFilesMap, [activeFilePath]: e.target.value })}
                      className="w-full flex-1 min-h-[420px] p-4 bg-white text-slate-800 border border-slate-200 font-mono text-sm rounded-b-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none shadow-inner"
                      placeholder="Write Dart code for this file..."
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-2">
                  <div className="flex justify-between items-center bg-slate-100 text-slate-700 border border-slate-200 border-b-0 px-3 py-2 rounded-t-lg text-xs font-mono font-semibold">
                    <span>lib/solution.dart (Single File Mode)</span>
                    <span className="text-slate-500 font-sans">Starter Code</span>
                  </div>
                  <textarea
                    value={formData.starterCode}
                    onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    className="w-full flex-1 min-h-[460px] p-4 bg-white text-slate-800 border border-slate-200 font-mono text-sm rounded-b-lg focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none shadow-inner"
                    placeholder="Widget buildUI() {&#10;  return Scaffold(&#10;    appBar: AppBar(title: Text('App')),&#10;  );&#10;}"
                  />
                </div>
              )}
            </div>
          )}

          {rightTab === 'testcases' && (
            <div className="space-y-6 animate-fadeIn">
              {isUiCompare ? (
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">UI Compare / Interactive Flutter Level</h4>
                  <p className="text-xs text-blue-700">
                    This question uses automated UI widget hierarchy scoring and custom assertions. Standard input/output test cases are disabled.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-800">Sample Test Cases (Visible)</h4>
                      <span className="text-xs text-gray-500">2 recommended</span>
                    </div>
                    <div className="space-y-2">
                      {sampleTestCases.map((tc, idx) => (
                        <TestCaseCard key={tc.id} testCase={tc} index={idx + 1} />
                      ))}
                      {sampleTestCases.length === 0 && (
                        <p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-lg">No sample test cases yet</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-800">Hidden Test Cases (Grading)</h4>
                      <span className="text-xs text-gray-500">8 recommended</span>
                    </div>
                    <div className="space-y-2">
                      {hiddenTestCases.map((tc, idx) => (
                        <TestCaseCard key={tc.id} testCase={tc} index={idx + 1} isHidden />
                      ))}
                      {hiddenTestCases.length === 0 && (
                        <p className="text-xs text-gray-500 py-4 text-center bg-gray-50 rounded-lg">No hidden test cases yet</p>
                      )}
                    </div>
                  </div>

                  {question?.id ? (
                    <div className="border-t border-gray-200 pt-5 space-y-3">
                      <h4 className="text-sm font-bold text-gray-800">Add New Test Case</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Input Arguments</label>
                          <input
                            type="text"
                            value={testCaseForm.input}
                            onChange={(e) => setTestCaseForm({ ...testCaseForm, input: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                            placeholder="e.g. 5, 10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Expected Output</label>
                          <input
                            type="text"
                            value={testCaseForm.expectedOutput}
                            onChange={(e) => setTestCaseForm({ ...testCaseForm, expectedOutput: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                            placeholder="e.g. 15"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testCaseForm.isHidden}
                            onChange={(e) => setTestCaseForm({ ...testCaseForm, isHidden: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-xs font-semibold text-gray-700">Hidden during student test run</span>
                        </label>
                        <button
                          onClick={handleAddTestCase}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                        >
                          Add Test Case
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 text-center font-semibold">
                      Save the question first before adding test cases.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {rightTab === 'resources' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-lg space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Reference Design Mockup</h4>
                <p className="text-xs text-gray-500">
                  Upload a screenshot or Figma export of the target UI design. Students can toggle this mockup to compare their layout.
                </p>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-gray-600"
                  />
                  <button
                    onClick={handleUploadReference}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold whitespace-nowrap hover:bg-blue-700"
                  >
                    {uploading ? 'Uploading...' : 'Upload Design'}
                  </button>
                </div>
                {formData.referenceImageUrl && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mt-3">
                    <div className="text-[11px] font-bold uppercase text-gray-500 mb-2">Active Design Mockup</div>
                    <img
                      src={`${API_ORIGIN}${formData.referenceImageUrl}`}
                      alt="Reference preview"
                      className="max-h-64 w-full object-contain rounded"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-5 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">Resource Asset Bundles</h4>
                <p className="text-xs text-gray-500">
                  Upload images, JSON datasets, or custom fonts. These files are automatically copied to <code>assets/images/</code> in the student's Flutter Docker container.
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleUploadResources}
                  className="block w-full text-xs text-gray-600"
                />

                {formData.resourceUrls.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {formData.resourceUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-mono text-gray-700 truncate max-w-[200px]">
                          {url.split('/').pop()}
                        </span>
                        <div className="flex items-center gap-3">
                          <a href={`${API_ORIGIN}${url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-semibold">
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteResource(url)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestCaseCard({ testCase, index, isHidden }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-gray-700">Test Case #{index}</span>
            {isHidden && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">Hidden</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="bg-white p-1.5 rounded border border-gray-200">
              <span className="text-gray-400 font-sans block text-[10px]">Input:</span>
              <span className="text-gray-800">{testCase.input || 'null'}</span>
            </div>
            <div className="bg-white p-1.5 rounded border border-gray-200">
              <span className="text-gray-400 font-sans block text-[10px]">Expected Output:</span>
              <span className="text-gray-800">{testCase.expected_output || 'null'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
