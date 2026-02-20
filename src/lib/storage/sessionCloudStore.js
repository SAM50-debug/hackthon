// FILE: src/lib/storage/sessionCloudStore.js
import { supabase } from "../supabaseClient";

/**
 * sessions table schema:
 * - id (uuid)
 * - user_id (uuid)
 * - created_at (timestamptz)
 * - payload (jsonb)  <-- stores full session object
 */

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

export async function saveSessionCloud(session) {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error("No user ID found, not signed in");
    throw new Error("Not signed in");
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert([
      {
        user_id: userId,
        payload: session,
      },
    ])
    .select();

  if (error) {
    console.error("Insert error:", error);
    throw error;
  }

  console.log("Inserted session:", data);
}

export async function loadSessionsCloud() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select("id, created_at, payload")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Convert DB rows back to app sessions array
  return (data || [])
    .map((r) => {
      const payload = r.payload || {};
      // Ensure we keep your session shape, but we can sync created_at
      return {
        ...payload,
        // prefer payload.createdAt if present, else use DB created_at
        createdAt: payload.createdAt ?? r.created_at,
        // keep the local session id if it exists
        id: payload.id ?? r.id,
        _rowId: r.id, // optional: DB row id (useful later)
      };
    })
    .filter(Boolean);
}

export async function clearSessionsCloud() {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from("sessions").delete().eq("user_id", userId);
  if (error) throw error;
}