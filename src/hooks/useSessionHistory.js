// FILE: src/hooks/useSessionHistory.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// local fallback
import { loadSessions, clearSessions } from "../lib/storage/sessionStore";

// cloud store
import { loadSessionsCloud, clearSessionsCloud } from "../lib/storage/sessionCloudStore";

export default function useSessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [user, setUser] = useState(null);

  // track auth user
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // load sessions depending on auth state
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (user) {
          const cloud = await loadSessionsCloud();
          if (alive) setSessions(cloud);
        } else {
          // local mode
          if (alive) setSessions(loadSessions());
        }
      } catch (e) {
        console.error("Failed loading sessions:", e);
        // fallback local if cloud fails
        if (alive) setSessions(loadSessions());
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  const refresh = async () => {
    try {
      if (user) setSessions(await loadSessionsCloud());
      else setSessions(loadSessions());
    } catch (e) {
      console.error("Refresh failed:", e);
      setSessions(loadSessions());
    }
  };

  const clearAll = async () => {
    try {
      if (user) {
        await clearSessionsCloud();
        setSessions([]);
      } else {
        clearSessions();
        setSessions([]);
      }
    } catch (e) {
      console.error("Clear failed:", e);
    }
  };

  return { sessions, refresh, clearAll, user };
}