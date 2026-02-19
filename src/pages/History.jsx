// FILE: src/pages/History.jsx
import { useState, useMemo } from "react";
import useSessionHistory from "../hooks/useSessionHistory";
import { getPerformanceTier } from "../utils/performance";
import Sparkline from "../components/Sparkline";
import { exportSessionsToPDF } from "../utils/pdfExport";

export default function History() {
  const { sessions, clearAll, refresh } = useSessionHistory();

  // Local UI state for filters/sort
  const [search, setSearch] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "best"

  // Local UI state for expanded cards (set of session IDs)
  const [expandedJsonIds, setExpandedJsonIds] = useState(new Set());
  const [expandedSummaryIds, setExpandedSummaryIds] = useState(new Set());

  // Derived Data: Stats (from ALL sessions)
  const stats = useMemo(() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    const validSessions = sessions.filter((s) => s && typeof s.score === "number");
    if (validSessions.length === 0) return null;

    const total = validSessions.length;
    const scores = validSessions.map((s) => Number(s.score ?? 0));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / total);
    const bestScore = Math.max(...scores);
    const lastScore = Number(validSessions[0]?.score ?? 0);

    return { total, avgScore, bestScore, lastScore };
  }, [sessions]);

  // Derived Data: Filtered & Sorted List
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    let result = [...sessions].filter((s) => s && s.createdAt); // Basic validity check

    // Filter: Exercise
    if (exerciseFilter !== "All") {
      result = result.filter((s) => s.exercise === exerciseFilter);
    }

    // Filter: Search (Name or Date)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        try {
          const dateStr = new Date(s.createdAt).toLocaleString().toLowerCase();
          return (s.exercise || "").toLowerCase().includes(q) || dateStr.includes(q);
        } catch {
          return false;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "best") {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      // default newest
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;
      return dateB - dateA;
    });

    return result;
  }, [sessions, exerciseFilter, search, sortBy]);

  // Handlers
  const toggleJson = (id) => {
    setExpandedJsonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSummary = (id) => {
    setExpandedSummaryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10 font-sans text-stone-900">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight">History</h2>
            <p className="text-stone-500 mt-2 text-sm tracking-wide uppercase font-medium">
              Your Training Log
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              disabled={!sessions || sessions.length === 0}
              onClick={() => exportSessionsToPDF(sessions)}
              className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md text-sm font-semibold flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <span>Export PDF</span>
            </button>
            <button
              onClick={refresh}
              className="p-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 hover:text-stone-900 transition-colors shadow-sm"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
            <button
              onClick={clearAll}
              className="p-2.5 bg-white border border-stone-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-100 hover:text-rose-700 transition-colors shadow-sm"
              title="Clear All History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="Total Sessions" value={stats.total} />
            <SummaryCard label="Last Score" value={stats.lastScore} />
            <SummaryCard label="Avg Score" value={stats.avgScore} />
            <SummaryCard label="Best Score" value={stats.bestScore} highlight />
          </div>
        )}

        {/* Filters & Toolbar */}
        <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-2 items-center justify-between sticky top-4 z-30 backdrop-blur-md bg-white/90">
          <div className="flex flex-1 gap-2 w-full md:w-auto p-1">
            <div className="relative flex-1 md:max-w-xs group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-600 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search date or exercise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border-transparent focus:bg-white border focus:border-stone-300 rounded-xl text-sm transition-all outline-none placeholder-stone-400 text-stone-700"
              />
            </div>
            <select
              value={exerciseFilter}
              onChange={(e) => setExerciseFilter(e.target.value)}
              className="px-4 py-2 bg-stone-50 hover:bg-stone-100 border-transparent rounded-xl text-sm font-medium text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer transition-colors"
            >
              <option value="All">All Exercises</option>
              <option value="Squat">Squat</option>
              <option value="Shoulder Raise">Shoulder Raise</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end p-1">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider hidden md:block">
              Sort
            </span>
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setSortBy("newest")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === "newest"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
                  }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy("best")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${sortBy === "best"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
                  }`}
              >
                Best Score
              </button>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 mb-4 text-stone-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
            </div>
            <p className="text-stone-500 font-medium">No sessions found.</p>
            <p className="text-stone-400 text-sm mt-1">
              Try changing your filters or record a new session.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSessions.map((s) => {
              const scoreNum = Number(s.score ?? 0);
              const tierInfo = getPerformanceTier(scoreNum);
              const isShoulder = s.exercise === "Shoulder Raise";

              // Timeline logic (preserved)
              const timelineArr = Array.isArray(s.timeline) ? s.timeline : [];
              const hasTimeline =
                isShoulder &&
                timelineArr.length >= 2 &&
                timelineArr.some((p) =>
                  typeof p === "number"
                    ? Number.isFinite(p)
                    : Number.isFinite(Number(p?.hd))
                );

              const m = s.mistakes || {};
              const mistakeList = Object.entries(m)
                .filter((entry) => entry[1] > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => ({
                  key: k,
                  label: k.replace(/([A-Z])/g, " $1").trim(),
                  count: v,
                }));

              const topMistakes = mistakeList.slice(0, 3);
              const isJsonExpanded = expandedJsonIds.has(s.id);
              const isSummaryExpanded = expandedSummaryIds.has(s.id);

              const dateObj = new Date(s.createdAt);
              const dateStr = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              const timeStr = dateObj.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              });

              // ✅ FIX: fatigue is an object, render a safe string
              const fatigueTrend = s?.fatigue?.trend ?? null;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-stone-300 transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-6 md:p-8">
                    {/* Top Row: Info & Score */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-full bg-stone-100 text-xs font-bold uppercase tracking-wider text-stone-600 border border-stone-200">
                            {s.exercise}
                          </span>
                          <span className="text-xs text-stone-400 font-medium">
                            {dateStr} • {timeStr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-4xl font-bold text-slate-800 leading-none tracking-tight">
                            {s.score}
                          </div>
                          <div
                            className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${tierInfo.className ?? "text-stone-500"
                              }`}
                          >
                            {tierInfo.label}
                          </div>
                        </div>
                        <div
                          className={`w-1.5 h-12 rounded-full ${getTierColorBg(
                            scoreNum
                          )} opacity-80`}
                        ></div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                      <StatChip label="Duration" value={`${s.durationSec ?? 0}s`} />
                      <StatChip label="Reps" value={s.reps} />
                      {s.calibration?.margin > 0 && (
                        <StatChip
                          label="Calib Margin"
                          value={Number(s.calibration.margin).toFixed(3)}
                        />
                      )}
                      {fatigueTrend && (
                        <StatChip
                          label="Fatigue Trend"
                          value={String(fatigueTrend).replace(/_/g, " ")}
                        />
                      )}
                    </div>

                    {/* Middle: Sparkline & Mistakes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-stone-100">
                      {/* Left: Sparkline */}
                      <div className="flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                              ></path>
                            </svg>
                            Symmetry Timeline
                          </span>
                          {hasTimeline && (
                            <span className="text-[10px] text-stone-300 font-medium bg-stone-50 px-2 py-0.5 rounded-full">
                              Lower is better
                            </span>
                          )}
                        </div>

                        {hasTimeline ? (
                          <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-100 relative group-hover:bg-stone-50 transition-colors">
                            <div className="text-slate-600 h-12 relative z-10">
                              <Sparkline data={timelineArr} valueKey="hd" width={400} height={50} />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-stone-50 rounded-xl p-8 border border-stone-100 flex items-center justify-center text-xs text-stone-400 italic dashed-border">
                            No timeline data recorded
                          </div>
                        )}
                      </div>

                      {/* Right: Top Mistakes */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              ></path>
                            </svg>
                            Improvements
                          </h4>
                        </div>

                        {topMistakes.length > 0 ? (
                          <div className="space-y-2">
                            {topMistakes.map((mm) => (
                              <div
                                key={mm.key}
                                className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-stone-50 transition-colors"
                              >
                                <span className="text-stone-600 font-medium capitalize">
                                  {mm.label}
                                </span>
                                <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md text-xs border border-rose-100">
                                  {mm.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-800">
                            <svg
                              className="w-5 h-5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            <span className="text-sm font-medium">
                              Perfect form! No mistakes detected.
                            </span>
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => toggleJson(s.id)}
                            className="text-[10px] font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            {isJsonExpanded ? "Hide Data" : "Raw Data"}
                            <svg
                              className={`w-3 h-3 transition-transform ${isJsonExpanded ? "rotate-180" : ""
                                }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Extended Details: JSON */}
                    {isJsonExpanded && (
                      <div className="mt-6 p-5 bg-stone-900 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 border border-stone-800 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-stone-500 uppercase font-mono">
                            DEBUG: Session Data
                          </span>
                        </div>
                        <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                          {JSON.stringify(
                            {
                              ...s,
                              // keep it readable: show fatigue as object, not rendered in span
                              fatigue: s?.fatigue ?? null,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}

                    {/* AI Summary */}
                    {s.aiSummary && (
                      <div className="mt-8 relative">
                        <div className="absolute top-0 left-6 -mt-3">
                          <span className="bg-white px-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px]">
                              AI
                            </span>
                            Analysis
                          </span>
                        </div>
                        <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl group-hover:bg-slate-50 transition-colors">
                          <div
                            className={`text-sm text-slate-600 leading-7 font-medium ${!isSummaryExpanded ? "line-clamp-2" : ""
                              }`}
                          >
                            {s.aiSummary}
                          </div>
                          {s.aiSummary.length > 150 && (
                            <button
                              onClick={() => toggleSummary(s.id)}
                              className="mt-3 text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
                            >
                              {isSummaryExpanded ? "Read Less" : "Read Full Analysis"}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-12 text-center pb-6">
          <p className="text-[10px] text-stone-300 uppercase tracking-widest font-medium">
            PoseRx Analytics • Private & Local
          </p>
        </div>
      </div>
    </div>
  );
}

// Sub-components for clean generic UI

function SummaryCard({ label, value, highlight }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-0.5 duration-300">
      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-1">
        {label}
      </span>
      <span
        className={`text-3xl font-bold tracking-tight ${highlight ? "text-emerald-600" : "text-stone-800"
          }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl flex flex-col items-center justify-center text-center transition-colors hover:bg-stone-100">
      <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold mb-0.5">
        {label}
      </span>
      <span className="text-base font-bold text-stone-700 tabular-nums">{value}</span>
    </div>
  );
}

function getTierColorBg(score) {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 80) return "bg-blue-500";
  if (score >= 60) return "bg-amber-400";
  return "bg-rose-500";
}