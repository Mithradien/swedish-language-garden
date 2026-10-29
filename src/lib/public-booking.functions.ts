import { createServerFn } from "@tanstack/react-start";
import { loadScheduleServer } from "./schedule";
import { rimInch } from "./prices";
import { z } from "zod";
import { endTimeFor, isBookable, serviceFor, stockholmNow } from "./booking-flow";

// Public endpoints for the customer booking page. They never return other customers' names or phone numbers.
const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9ÅÄÖ]/g, "");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function takenTimes(date: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows } = await supabaseAdmin.from("bookings").select("booking_key,start_time").eq("booking_date", date);
  const keys = (rows ?? []).map((r) => r.booking_key);
  const { data: st } = keys.length
    ? await supabaseAdmin.from("booking_statuses").select("booking_key,status").in("booking_key", keys)
    : { data: [] as { booking_key: string; status: string }[] };
  const cancelled = new Set((st ?? []).filter((s) => s.status === "avbokad").map((s) => s.booking_key));
  const { data: locks } = await supabaseAdmin.from("slot_locks").select("slot_time").eq("slot_date", date);
  const booked = (rows ?? []).filter((r) => !cancelled.has(r.booking_key)).map((r) => r.start_time.slice(0, 5));
  // Staff-locked slots are reported as taken so customers can never book them.
  return [...booked, ...(locks ?? []).map((l) => l.slot_time.slice(0, 5))];
}

export const publicTakenTimes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ date: dateSchema }).parse(d))
  .handler(async ({ data }) => ({ taken: await takenTimes(data.date) }));

export const publicCarLookup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ regnr: z.string().min(2).max(12) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: car } = await supabaseAdmin.from("car_storage").select("regnr,modell,lagerplats,tires").eq("regnr", clean(data.regnr)).maybeSingle();
    if (!car) return null;
    const tires = Array.isArray(car.tires) ? (car.tires as { dimension?: string }[]) : [];
    const inches = tires.map((t) => rimInch(String(t.dimension ?? ""))).filter((n): n is number => n != null);
    return { regnr: car.regnr, modell: car.modell, harDack: car.lagerplats.trim() !== "", tum: inches.length ? Math.max(...inches) : null };
  });

export const createPublicBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    regnr: z.string().min(2).max(12),
    tillId: z.string().max(10), franId: z.string().max(10),
    date: dateSchema, time: z.string().regex(/^\d{2}:\d{2}$/),
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().min(5).max(30),
    email: z.string().trim().email().max(255),
    note: z.string().max(1000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    await loadScheduleServer();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const regnr = clean(data.regnr);
    const service = serviceFor(data.tillId, data.franId);
    if (service === "Okänd") return { ok: false as const, error: "Välj vad som ska hända med däcken." };
    const taken = await takenTimes(data.date);
    if (!isBookable(data.date, data.time, stockholmNow(), taken)) {
      return { ok: false as const, error: "Tiden är inte längre ledig. Välj en annan tid." };
    }
    const { error } = await supabaseAdmin.from("bookings").insert({
      booking_key: `${data.date}|${data.time}|${regnr}`, regnr, name: data.name, phone: data.phone,
      email: data.email, note: data.note || null, booking_date: data.date, start_time: data.time,
      end_time: endTimeFor(data.time), service, source: "kund",
    });
    if (error) return { ok: false as const, error: "Tiden kunde inte bokas. Försök med en annan tid." };
    return { ok: true as const, service };
  });
