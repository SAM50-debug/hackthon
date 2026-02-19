import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-4xl font-bold text-blue-700 mb-6">
        Welcome to PoseRx
      </h2>

      <p className="text-gray-600 max-w-xl mb-8">
        AI-powered rehabilitation assistant for real-time posture monitoring
        and corrective feedback.
      </p>

      <Link
        to="/coach"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Start Coaching
      </Link>

      <p className="text-xs text-gray-400 mt-10 max-w-md">
        This tool is for educational purposes only and does not provide
        medical advice.
      </p>
    </div>
  );
}
