import { useEffect, useState } from "react";
import { loadSessions, clearSessions } from "../lib/storage/sessionStore";

export default function useSessionHistory() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const refresh = () => setSessions(loadSessions());

  const clearAll = () => {
    clearSessions();
    setSessions([]);
  };

  return { sessions, refresh, clearAll };
}
