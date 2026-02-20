import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("sign_in"); // "sign_in" | "sign_up"
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const emailTrimmed = email.trim();

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      if (view === "sign_up") {
        const { error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
        });
        if (error) throw error;
        setMessage("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
        });
        if (error) throw error;
        // Navigation typically handled by user state change or explicit redirect if needed
        navigate("/coach"); 
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">PoseRx</h1>
          <p className="text-stone-500">Sign in to sync your progress</p>
        </div>

        {user ? (
          <div className="space-y-6">
            <div className="bg-stone-50 p-4 rounded-xl text-center">
              <p className="text-sm text-stone-500 mb-1">Signed in as</p>
              <p className="font-medium text-stone-900">{user.email}</p>
            </div>
            
            <div className="grid gap-3">
              <Link
                to="/history"
                className="block w-full text-center py-3 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
              >
                Go to History
              </Link>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                {loading ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        ) : (
          <div>
             {/* Tabs */}
            <div className="flex p-1 bg-stone-100 rounded-xl mb-6">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  view === "sign_in"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
                onClick={() => setView("sign_in")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  view === "sign_up"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
                onClick={() => setView("sign_up")}
              >
                Sign Up
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-700 text-sm border border-rose-100">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">
                {message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-stone-900 placeholder:text-stone-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-stone-900 placeholder:text-stone-400"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 mt-2"
              >
                {loading
                  ? "Processing..."
                  : view === "sign_in"
                  ? "Sign In"
                  : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/coach"
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Continue without sign-in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
