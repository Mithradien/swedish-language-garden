import { supabase } from "@/integrations/supabase/client";
import type { CarCard, Tire } from "@/lib/bookings";

/** Imported values update a car; blanks in the new file never erase what is already stored. */
export function mergeCard(old: CarCard | undefined, next: CarCard): CarCard {
  if (!old) return next;
  const pick = (a: string, b: string) => (b.trim() ? b : a);
  return {
    regnr: next.regnr,
    modell: pick(old.modell, next.modell),
    lagerplats: pick(old.lagerplats, next.lagerplats),
    kundnr: pick(old.kundnr, next.kundnr),
    owner: pick(old.owner, next.owner),
    phone: pick(old.phone, next.phone),
    email: pick(old.email, next.email),
    minDepth: next.minDepth ?? old.minDepth,
    tires: next.tires.length ? next.tires : old.tires,
  };
}

type Row = { regnr: string; modell: string; lagerplats: string; kundnr: string; owner: string; phone: string; email: string; min_depth: number | null; tires: unknown };
const toCard = (r: Row): CarCard => ({
  regnr: r.regnr, modell: r.modell, lagerplats: r.lagerplats, kundnr: r.kundnr, owner: r.owner,
  phone: r.phone, email: r.email, minDepth: r.min_depth == null ? null : Number(r.min_depth),
  tires: Array.isArray(r.tires) ? (r.tires as Tire[]) : [],
});

/** Staff-only read of every stored car. Null when signed out or not allowed. */
export async function fetchCarStorage(): Promise<Map<string, CarCard> | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const out = new Map<string, CarCard>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("car_storage").select("*").order("regnr").range(from, from + 999);
    if (error) return null;
    for (const r of data ?? []) out.set(r.regnr, toCard(r as Row));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Superadmin: add new cars and update existing ones; cars missing from the file are kept. */
export async function syncCarStorage(cards: Map<string, CarCard>): Promise<number | null> {
  const existing = await fetchCarStorage();
  if (!existing) return null;
  const rows = [...cards.values()].map(c => {
    const m = mergeCard(existing.get(c.regnr), c);
    return { regnr: m.regnr, modell: m.modell, lagerplats: m.lagerplats, kundnr: m.kundnr, owner: m.owner,
      phone: m.phone, email: m.email, min_depth: m.minDepth, tires: m.tires as never, updated_at: new Date().toISOString() };
  });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("car_storage").upsert(rows.slice(i, i + 500), { onConflict: "regnr" });
    if (error) return null;
  }
  return rows.length;
}
