import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Clock, User, Image as ImageIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminManualGrading() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [manualScore, setManualScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, graded, all

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/submissions/ui?filter=${filter}`,
        {
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to load submissions');
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function submitManualGrade() {
    if (!selectedSubmission || manualScore === '') return;

    const score = parseInt(manualScore);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('Please enter a valid score between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/submissions/${selectedSubmission.id}/manual-grade`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualScore: score,
            feedback: feedback.trim(),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit grade');

      alert('Manual grade submitted successfully!');
      setSelectedSubmission(null);
      setManualScore('');
      setFeedback('');
      loadSubmissions();
    } catch (err) {
      console.error('Error submitting grade:', err);
      alert('Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  }

  function getFinalScore(sub) {
    if (sub.manual_score !== null && sub.score !== null) {
      return ((sub.score * 0.5) + (sub.manual_score * 0.5)).toFixed(1);
    }
    return '-';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Code Review - UI Test</h2>
        <p className="text-sm text-gray-600">
          Review and manually grade UI test submissions. Each submission receives 50% automated + 50% manual grading.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="inline-block w-4 h-4 mr-1" />
              Pending Grading
            </button>
            <button
              onClick={() => setFilter('graded')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'graded'
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="inline-block w-4 h-4 mr-1" />
              Graded
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Submissions
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No submissions found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">
                        {sub.user_name || sub.user_email}
                      </span>
                      <span className="text-sm text-gray-500">
                        Session #{sub.test_session_id}
                      </span>
                      <span className="text-sm text-gray-500">
                        Problem #{sub.problem_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${
                        sub.status === 'PASS'
                          ? 'text-green-600'
                          : sub.status === 'FAIL'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}>
                        Auto: {sub.status === 'AWAITING_MANUAL' ? 'Awaiting manual grade' : sub.status} ({sub.score || 0}%)
                      </span>
                      {sub.manual_score !== null ? (
                        <>
                          <span className="text-blue-600 font-medium">
                            Manual: {sub.manual_score}%
                          </span>
                          <span className="text-purple-600 font-bold">
                            Final: {getFinalScore(sub)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          <Clock className="inline-block w-3 h-3 mr-1" />
                          Awaiting Manual Grade
                        </span>
                      )}
                      <span className="text-gray-400">
                        {new Date(sub.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setManualScore(sub.manual_score?.toString() || '');
                      setFeedback(sub.manual_feedback || '');
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {sub.manual_score !== null ? 'Review' : 'Grade'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                Manual Grading - Submission #{selectedSubmission.id}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Student: {selectedSubmission.user_name || selectedSubmission.user_email} | 
                Problem #{selectedSubmission.problem_id}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Automated Score */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Automated Score (50%)</h4>
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-bold ${
                    selectedSubmission.status === 'PASS'
                      ? 'text-green-600'
                      : selectedSubmission.status === 'FAIL'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}>
                    {selectedSubmission.score || 0}%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSubmission.status === 'PASS'
                      ? 'bg-green-100 text-green-700'
                      : selectedSubmission.status === 'FAIL'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedSubmission.status === 'AWAITING_MANUAL' ? 'Awaiting manual grade' : selectedSubmission.status}
                  </span>
                </div>
              </div>

              {/* Images Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Expected (Reference)
                  </h4>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    {selectedSubmission.reference_image_url ? (
                      <img
                        src={`${API_BASE}${selectedSubmission.reference_image_url}`}
                        alt="Reference"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="p-8 text-center text-gray-500">No reference image</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Student Output
                  </h4>
                  <div className="border-2 border-blue-300 rounded-lg overflow-hidden bg-gray-100">
                    {selectedSubmission.preview_image_url ? (
                      <img
                        src={`${API_BASE}${selectedSubmission.preview_image_url}`}
                        alt="Student Output"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="p-8 text-center text-gray-500">No preview image</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Code */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Student Code</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  {selectedSubmission.code}
                </pre>
              </div>

              {/* Manual Grading Form */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-4">Manual Grading (50%)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manual Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={manualScore}
                      onChange={(e) => setManualScore(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter score (0-100)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter feedback for the student..."
                    />
                  </div>

                  {manualScore !== '' && (
                    <div className="bg-white rounded-lg p-4 border border-gray-300">
                      <h5 className="font-semibold text-gray-700 mb-2">Final Score Calculation</h5>
                      <div className="text-sm space-y-1">
                        <div>Automated Score: {selectedSubmission.score || 0}% × 0.5 = {((selectedSubmission.score || 0) * 0.5).toFixed(1)}%</div>
                        <div>Manual Score: {manualScore}% × 0.5 = {(parseInt(manualScore || 0) * 0.5).toFixed(1)}%</div>
                        <div className="font-bold text-lg mt-2 text-purple-600">
                          Final Score: {((selectedSubmission.score || 0) * 0.5 + parseInt(manualScore || 0) * 0.5).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setManualScore('');
                  setFeedback('');
                }}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitManualGrade}
                disabled={submitting || manualScore === ''}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Manual Grade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
