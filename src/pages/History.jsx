// FILE: src/pages/History.jsx
import useSessionHistory from "../hooks/useSessionHistory";
import { getPerformanceTier } from "../utils/performance";
import Sparkline from "../components/Sparkline";

export default function History() {
  const { sessions, clearAll, refresh } = useSessionHistory();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Session History</h2>

        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-gray-500">
          No sessions saved yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const scoreNum = Number(s.score ?? 0);
            const tierInfo = getPerformanceTier(scoreNum);

            const isShoulder = s.exercise === "Shoulder Raise";

            // supports both formats:
            // - timeline: [{t, hd}, ...]
            // - timeline already reduced to numbers
            const timelineArr = Array.isArray(s.timeline) ? s.timeline : [];
            const hasTimeline =
              isShoulder &&
              timelineArr.length >= 2 &&
              timelineArr.some((p) =>
                typeof p === "number" ? Number.isFinite(p) : Number.isFinite(Number(p?.hd))
              );

            const m = s.mistakes || {};
            const tempoFast = Number(m.shoulderTooFast ?? 0);
            const tempoSlow = Number(m.shoulderTooSlow ?? 0);
            const unstable = Number(m.shoulderUnstable ?? 0);

            const calibratedMargin = Number(s?.calibration?.margin);
            const hasCalib = Number.isFinite(calibratedMargin);

            return (
              <div key={s.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-gray-800">
                      {s.exercise}
                    </p>

                    <p className="text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>
                        Duration:{" "}
                        <span className="font-semibold text-gray-700">
                          {s.durationSec ?? 0}s
                        </span>
                      </span>

                      <span className="text-gray-300">•</span>

                      <span>
                        Tier:{" "}
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded-full ${tierInfo.className}`}
                        >
                          {s.tier ?? tierInfo.label}
                        </span>
                      </span>

                      {hasCalib && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>
                            Calib margin:{" "}
                            <span className="font-semibold text-gray-700">
                              {calibratedMargin.toFixed(3)}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {hasTimeline && (
                      <div className="mt-4 p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-gray-500">
                            Symmetry timeline (spikes = uneven arms)
                          </div>

                          <div className="text-blue-700">
                            {/* Sparkline v2 can take timeline objects directly */}
                            <Sparkline data={timelineArr} valueKey="hd" />
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-600">
                          <span>
                            Unstable: <span className="font-semibold">{unstable}</span>
                          </span>
                          <span>
                            Too fast: <span className="font-semibold">{tempoFast}</span>
                          </span>
                          <span>
                            Too slow: <span className="font-semibold">{tempoSlow}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {s.score}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded-lg">
                    <p className="text-gray-500">Reps</p>
                    <p className="text-lg font-bold">{s.reps}</p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <p className="text-gray-500">Top Mistakes (counts)</p>
                    <pre className="text-xs mt-2 whitespace-pre-wrap text-gray-700">
                      {JSON.stringify(s.mistakes, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-8 max-w-2xl">
        Local-only storage: sessions are saved in your browser on this device.
      </p>
    </div>
  );
}
