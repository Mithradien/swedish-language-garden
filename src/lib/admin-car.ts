import { normalizeRegnr, type Booking, type CarCard } from "@/lib/bookings";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CarEvent = Tables<"status_events">;
export type CarWorkOrder = Tables<"work_orders">;

/** Match one vehicle exactly; substring matching is only for the search list. */
export function carBookings(regnr: string, bookings: Booking[]): Booking[] {
  const key = normalizeRegnr(regnr);
  if (!key) return [];
  return bookings.filter(b => normalizeRegnr(b.regnr) === key)
    .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
}

const text = (v: string | null | undefined) => String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const digits = (v: string | null | undefined) => String(v ?? "").replace(/\D/g, "");

/** Bred sökning: regnr, kundnamn, kundnummer, lagerplats, bilmodell, telefon och e-post. */
export function bookingMatches(query: string, b: Booking): boolean {
  const t = text(query); if (!t) return false;
  const key = normalizeRegnr(query); const d = digits(query);
  return (!!key && normalizeRegnr(b.regnr).includes(key)) || text(b.name).includes(t) || (d.length >= 4 && digits(b.phone).includes(d));
}

export function searchCars(query: string, bookings: Booking[], cards: Map<string, CarCard>, storage: Map<string, string>): string[] {
  const t = text(query);
  if (!t) return [];
  const key = normalizeRegnr(query);
  const d = digits(query);
  const hit = new Set<string>();
  const all = [...new Set([...bookings.map(b => normalizeRegnr(b.regnr)), ...cards.keys(), ...storage.keys()])];
  for (const regnr of all) {
    if (!regnr) continue;
    const c = cards.get(regnr);
    const plats = storage.get(regnr) || c?.lagerplats || "";
    if ((key && regnr.includes(key)) || text(plats) === t || (t.length >= 2 && text(plats).startsWith(t))
      || (c && (text(c.modell).includes(t) || text(c.owner).includes(t) || text(c.email).includes(t)
        || (c.kundnr && text(c.kundnr) === t) || (d.length >= 4 && digits(c.phone).includes(d))))) hit.add(regnr);
  }
  for (const b of bookings) if (bookingMatches(query, b)) hit.add(normalizeRegnr(b.regnr));
  return [...hit].filter(Boolean).sort();
}

/** Existing staff RLS policies govern both reads; never use an admin client. */
export async function fetchCarHistory(regnr: string): Promise<{ events: CarEvent[]; orders: CarWorkOrder[] }> {
  const key = normalizeRegnr(regnr);
  const events: CarEvent[] = [];
  const orders: CarWorkOrder[] = [];
  const readEvents = async () => {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("status_events").select("*").eq("regnr", key)
        .order("created_at", { ascending: false }).order("id").range(from, from + 999);
      if (error) throw new Error("Besökshistoriken kunde inte hämtas.");
      events.push(...(data ?? []));
      if (!data || data.length < 1000) return;
    }
  };
  const readOrders = async () => {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("work_orders").select("*").eq("regnr", key)
        .order("booking_date", { ascending: false }).order("id").range(from, from + 999);
      if (error) throw new Error("Däckprotokollen kunde inte hämtas.");
      orders.push(...(data ?? []));
      if (!data || data.length < 1000) return;
    }
  };
  await Promise.all([readEvents(), readOrders()]);
  return { events, orders };
}