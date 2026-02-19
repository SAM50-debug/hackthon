import useSessionHistory from "../hooks/useSessionHistory";
import { getPerformanceTier } from "../utils/performance";

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
            const tierInfo = getPerformanceTier(Number(s.score ?? 0));
            return (
              <div key={s.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {s.exercise}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Duration:{" "}
                      <span className="font-semibold">{s.durationSec ?? 0}s</span>{" "}
                      • Tier:{" "}
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full ml-1 ${tierInfo.className}`}
                      >
                        {s.tier ?? tierInfo.label}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-blue-700">{s.score}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
