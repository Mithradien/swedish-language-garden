import { normalizeRegnr, type Booking, type CarCard } from "@/lib/bookings";

export interface PickRow { key: string; regnr: string; start: string; name: string; service: string; lagerplats: string; modell: string }

/** Wheels to fetch from storage for a day: skip cancelled and new-storage bookings, sort by storage location. */
export function buildPickList(bookings: Booking[], cards: Map<string, CarCard>, cancelled: Set<string>, keyOf: (b: Booking) => string): PickRow[] {
  const byReg = new Map<string, CarCard>();
  for (const c of cards.values()) byReg.set(normalizeRegnr(c.regnr), c);
  const rows: PickRow[] = [];
  for (const b of bookings) {
    const key = keyOf(b);
    if (cancelled.has(key) || b.service === "Nyförvaring") continue;
    const card = byReg.get(normalizeRegnr(b.regnr));
    if (!card || !card.lagerplats.trim()) continue;
    rows.push({ key, regnr: b.regnr, start: b.start, name: b.name, service: b.service, lagerplats: card.lagerplats.trim(), modell: card.modell });
  }
  return rows.sort((a, b) => a.lagerplats.localeCompare(b.lagerplats, "sv", { numeric: true }) || a.start.localeCompare(b.start));
}

export function nextDay(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
