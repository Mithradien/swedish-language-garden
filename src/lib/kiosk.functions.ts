import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public kiosk endpoints: only today's bookings, and only time + service are returned (no names or phone numbers).
function todayStockholm() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
}
const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9ÅÄÖ]/g, "");

export const kioskLookup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ regnr: z.string().min(2).max(10) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const regnr = clean(data.regnr);
    const { data: rows } = await supabaseAdmin.from("bookings")
      .select("booking_key,regnr,booking_date,start_time,end_time,service")
      .eq("booking_date", todayStockholm()).eq("regnr", regnr).order("start_time");
    const keys = (rows ?? []).map(r => r.booking_key);
    const { data: st } = keys.length ? await supabaseAdmin.from("booking_statuses").select("booking_key,status").in("booking_key", keys) : { data: [] };
    const blocked = new Set((st ?? []).filter(s => s.status === "avbokad").map(s => s.booking_key));
    const arrived = new Set((st ?? []).filter(s => s.status === "ankommen").map(s => s.booking_key));
    return (rows ?? []).filter(r => !blocked.has(r.booking_key)).map(r => ({
      key: r.booking_key, regnr: r.regnr, date: r.booking_date, start: r.start_time, end: r.end_time ?? "", service: r.service ?? "", arrived: arrived.has(r.booking_key),
    }));
  });

export const kioskRegister = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ key: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b } = await supabaseAdmin.from("bookings").select("booking_key,regnr,booking_date").eq("booking_key", data.key).maybeSingle();
    if (!b || b.booking_date !== todayStockholm()) throw new Error("Ingen bokning idag");
    const { data: cur } = await supabaseAdmin.from("booking_statuses").select("status").eq("booking_key", b.booking_key).maybeSingle();
    if (cur?.status === "ankommen") return { result: "already" as const };
    await supabaseAdmin.from("booking_statuses").upsert({ booking_key: b.booking_key, status: "ankommen", updated_at: new Date().toISOString(), updated_by: null });
    await supabaseAdmin.from("status_events").insert({ booking_key: b.booking_key, regnr: b.regnr, status: "ankommen", source: "kiosk" });
    return { result: "registered" as const };
  });
