import { createServerFn } from "@tanstack/react-start";
import { loadScheduleServer } from "./schedule";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canStaffMoveTo, endTimeFor, moveNote } from "./booking-flow";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

/** Superadmin moves a booking (customer phoned in). Old time is noted and logged; nothing is deleted. */
export const staffMoveBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string().min(5).max(80), date: dateSchema, time: timeSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await loadScheduleServer();
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "superadmin" });
    if (!isAdmin) throw new Error("Bara superadmin kan flytta bokningar");
    const { data: b } = await supabase.from("bookings").select("*").eq("booking_key", data.key).maybeSingle();
    if (!b) throw new Error("Bokningen hittades inte");
    const { data: rows } = await supabase.from("bookings").select("booking_key,start_time").eq("booking_date", data.date);
    const keys = (rows ?? []).map((r) => r.booking_key);
    const { data: st } = keys.length ? await supabase.from("booking_statuses").select("booking_key,status").in("booking_key", keys) : { data: [] };
    const cancelled = new Set((st ?? []).filter((s) => s.status === "avbokad").map((s) => s.booking_key));
    const taken = (rows ?? []).filter((r) => r.booking_key !== b.booking_key && !cancelled.has(r.booking_key)).map((r) => r.start_time.slice(0, 5));
    if (!canStaffMoveTo(data.date, data.time, taken)) throw new Error("Tiden är inte ledig");
    const newKey = `${data.date}|${data.time}|${b.regnr}`;
    const { error } = await supabase.from("bookings").update({
      booking_key: newKey, booking_date: data.date, start_time: data.time, end_time: endTimeFor(data.time),
      note: moveNote(b.note, b.booking_date, b.start_time), updated_at: new Date().toISOString(),
    }).eq("booking_key", b.booking_key);
    if (error) throw new Error("Kunde inte flytta bokningen");
    await supabase.from("booking_statuses").delete().eq("booking_key", b.booking_key);
    await supabase.from("status_events").insert({ booking_key: b.booking_key, regnr: b.regnr, status: "flyttad", source: "personal", actor_id: userId });
    return { key: newKey };
  });
