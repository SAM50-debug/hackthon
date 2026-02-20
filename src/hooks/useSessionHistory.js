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

    try {
      // wait for auth to fully initialize
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // not signed in → local only
        setSessions(loadSessions());
        return;
      }

      // signed in → fetch cloud
      const cloud = await loadSessionsCloud();

      if (Array.isArray(cloud)) {
        setSessions(cloud);
      }
    } catch (err) {
      console.error("History refresh error:", err);
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refresh();
      }
    });

    refresh();

    return () => subscription.unsubscribe();
  }, [refresh]);

  return { sessions, refresh, clearAll, loading };
}