import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-600">PoseRx</h1>

      <div className="flex gap-6">
        <Link to="/" className="hover:text-blue-600">
          Home
        </Link>
        <Link to="/coach" className="hover:text-blue-600">
          Coach
        </Link>
        <Link to="/history" className="hover:text-blue-600">
          History
        </Link>
        <Link to="/auth" className="text-stone-500 hover:text-blue-600">
          Sign In
        </Link>
      </div>
    </nav>
  );
}
