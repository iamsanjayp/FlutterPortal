import { useEffect, useState, useMemo } from "react";
import { fetchFeedbacks } from "../../api/adminApi";
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  Download, 
  Star, 
  Filter, 
  ThumbsUp, 
  AlertTriangle, 
  Layers, 
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stats, setStats] = useState({
    avgRating: 0,
    totalCount: 0,
    ratingDistribution: {},
  });

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchFeedbacks({
        search: search.trim() || undefined,
        rating: ratingFilter !== "all" ? ratingFilter : undefined,
        level: levelFilter !== "all" ? levelFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        page,
        limit,
      });
      setFeedbacks(res.feedbacks || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
      setError(err?.message || "Failed to load student feedbacks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [page, ratingFilter, levelFilter, categoryFilter]);

  // Handle live search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Unique categories and levels from feedbacks for filter dropdowns
  const availableLevels = useMemo(() => {
    const set = new Set();
    feedbacks.forEach(f => {
      if (f.level) set.add(f.level);
    });
    return Array.from(set).sort();
  }, [feedbacks]);

  function exportCSV() {
    if (!feedbacks.length) return;
    const headers = ["ID", "Student Name", "Roll No", "Email", "Session ID", "Level", "Rating", "Category", "Feedback", "Date"];
    const rows = feedbacks.map(f => [
      f.id,
      `"${(f.user_name || "").replace(/"/g, '""')}"`,
      `"${(f.roll_no || "").replace(/"/g, '""')}"`,
      `"${(f.user_email || "").replace(/"/g, '""')}"`,
      f.test_session_id,
      f.level || "",
      f.rating || "",
      `"${(f.category || "").replace(/"/g, '""')}"`,
      `"${(f.feedback || "").replace(/"/g, '""')}"`,
      `"${new Date(f.created_at).toLocaleString()}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_feedbacks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Calculate quick summary metrics
  const totalCount = stats.totalFeedbacks ?? stats.totalCount ?? feedbacks.length;
  const avgRating = stats.avgRating || (feedbacks.length ? (feedbacks.reduce((a, b) => a + (b.rating || 5), 0) / feedbacks.length).toFixed(1) : "5.0");
  const highRatings = stats.positiveCount ?? ((stats.ratingDistribution?.[5] || 0) + (stats.ratingDistribution?.[4] || 0));
  const lowRatings = stats.needsAttentionCount ?? ((stats.ratingDistribution?.[1] || 0) + (stats.ratingDistribution?.[2] || 0));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Student Feedback</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monitor student experience, difficulty satisfaction, and bug reports across Coding and UI tests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={!feedbacks.length}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
              <span className="text-xs text-gray-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5 text-amber-400">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= Math.round(Number(avgRating)) ? "fill-amber-400" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Total Feedback Submitted */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Submissions</p>
            <div className="mt-1">
              <span className="text-2xl font-bold text-gray-900">{totalCount}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">From students & evaluators</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Positive (4-5★)</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{highRatings}</span>
              {totalCount > 0 && (
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                  {Math.round((highRatings / totalCount) * 100)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">High satisfaction</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>

        {/* Attention / Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Needs Attention (1-2★)</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">{lowRatings}</span>
              {lowRatings > 0 && (
                <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                  Check issues
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Bugs or difficult tests</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or keywords in comment..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars ★★★★★</option>
            <option value="4">4 Stars ★★★★</option>
            <option value="3">3 Stars ★★★</option>
            <option value="2">2 Stars ★★</option>
            <option value="1">1 Star ★</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Problem Clarity">Problem Clarity</option>
            <option value="Test Cases">Test Cases</option>
            <option value="IDE Experience">IDE Experience</option>
            <option value="UI Preview">UI Preview</option>
            <option value="Difficulty Level">Difficulty Level</option>
            <option value="Time Duration">Time Duration</option>
            <option value="General">General</option>
          </select>

          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">All Levels</option>
            {availableLevels.map(lvl => (
              <option key={lvl} value={lvl}>Level {lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
            <p className="text-xs font-semibold">Loading student feedback…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Feedback Records Found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              There are no student feedbacks matching your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 w-1/3">Feedback / Comment</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbacks.map((item) => {
                  const ratingVal = item.rating || 5;
                  const isHigh = ratingVal >= 4;
                  const isLow = ratingVal <= 2;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {item.user_name ? item.user_name.charAt(0) : "S"}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">
                              {item.user_name || "Unknown Student"}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              {item.roll_no || item.user_email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          Level {item.level || "N/A"}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              isHigh ? "text-emerald-600" : isLow ? "text-rose-600" : "text-amber-500"
                            }`}
                          >
                            {ratingVal}★
                          </span>
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= ratingVal ? "fill-amber-400" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            item.category === "Problem Clarity"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : item.category === "Test Cases"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : item.category === "IDE Experience"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : item.category === "UI Preview"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : item.category === "Difficulty Level"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {item.category || "General"}
                        </span>
                      </td>

                      {/* Feedback Text */}
                      <td className="py-3.5 px-4 text-gray-800 font-normal leading-relaxed">
                        <p className="line-clamp-3 select-text bg-gray-50/60 p-2 rounded-lg border border-gray-100">
                          {item.feedback || <span className="text-gray-400 italic">No written comment provided.</span>}
                        </p>
                      </td>

                      {/* Session ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-500 text-[11px]">
                        #{item.test_session_id}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">{feedbacks.length}</span> feedback records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium px-2">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={feedbacks.length < limit}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
