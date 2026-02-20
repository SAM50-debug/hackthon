import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  loadSessionsCloud,
  clearSessionsCloud,
} from "../lib/storage/sessionCloudStore";
import {
  loadSessions,
  clearSessions,
} from "../lib/storage/sessionStore";

export default function useSessionHistory() {
  const [sessions, setSessions] = useState(() => loadSessions()); // show local immediately
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    // IMPORTANT: never blank the UI while loading
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        const cloud = await loadSessionsCloud();
        // Only replace if we actually got an array back
        if (Array.isArray(cloud)) setSessions(cloud);
      } else {
        // Not signed in → stay local
        setSessions(loadSessions());
      }
    } catch (e) {
      // If cloud fetch fails, KEEP current sessions (prevents disappearing)
      console.error("History refresh failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        await clearSessionsCloud();
        setSessions([]);
      } else {
        clearSessions();
        setSessions([]);
      }
    } catch (e) {
      console.error("Clear history failed:", e);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Re-fetch when auth state changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  return { sessions, refresh, clearAll, loading };
}