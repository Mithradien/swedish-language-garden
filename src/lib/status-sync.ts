import { supabase } from "@/integrations/supabase/client";
import type { ArrivalStatus } from "@/lib/arrival";

/** Staff-only: read shared statuses. Returns null when not signed in as staff. */
export async function fetchDbStatuses(): Promise<Record<string, ArrivalStatus> | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("booking_statuses").select("booking_key,status");
  if (error) return null;
  return Object.fromEntries((data ?? []).map(r => [r.booking_key, r.status as ArrivalStatus]));
}

/** Staff-only: save a status and log it in the history. "vantas" removes the shared status. */
export async function saveDbStatus(key: string, regnr: string, status: ArrivalStatus): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const r = status === "vantas"
    ? await supabase.from("booking_statuses").delete().eq("booking_key", key)
    : await supabase.from("booking_statuses").upsert({ booking_key: key, status, updated_by: u.user.id, updated_at: new Date().toISOString() });
  if (r.error) return false;
  await supabase.from("status_events").insert({ booking_key: key, regnr, status, source: "personal", actor_id: u.user.id });
  return true;
}

/** Staff-only: when each arrived/late booking was registered (booking_key -> ISO time). */
export async function fetchDbArrivalTimes(): Promise<Record<string, string> | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase.from("booking_statuses").select("booking_key,updated_at").in("status", ["ankommen", "sen"]);
  if (error) return null;
  return Object.fromEntries((data ?? []).map(r => [r.booking_key, r.updated_at as string]));
}
