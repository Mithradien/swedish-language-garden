import { normalizeRegnr, parseBookingsCsv, type Booking, type ScheduleRow } from "./bookings";

export const CSV_KEY = "bokningar.csv.v1";
export const STATUS_KEY = "bokningar.status.v1";
export const ARRIVAL_HISTORY_KEY = "bokningar.arrivals.v1";
export type ArrivalStatus = "vantas" | "ankommen" | "sen" | "ej" | "avbokad";
type Statuses = Record<string, ArrivalStatus>;
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type ArrivalEvent = { bookingKey: string; regnr: string; arrivedAt: string };

export function statusKey(b: Pick<ScheduleRow, "date" | "start" | "regnr">) {
  return `${b.date}|${b.start}|${b.regnr}`;
}

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function readStatuses(store: Store): Statuses {
  const raw = store.getItem(STATUS_KEY);
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Ogiltiga ankomstuppgifter.");
  return parsed;
}

export function readBookings(store: Store): Booking[] {
  const raw = store.getItem(CSV_KEY);
  if (!raw) return [];
  const saved = JSON.parse(raw);
  if (typeof saved?.text !== "string") throw new Error("Bokningsfilen kunde inte läsas.");
  return parseBookingsCsv(saved.text);
}

/** Staff reset to "Väntas": drop status and the kiosk arrival event so the car is unregistered again. */
export function resetArrival(store: Store, key: string): Statuses {
  const statuses = readStatuses(store);
  delete statuses[key];
  store.setItem(STATUS_KEY, JSON.stringify(statuses));
  const raw = store.getItem(ARRIVAL_HISTORY_KEY);
  const history: unknown = raw ? JSON.parse(raw) : [];
  if (Array.isArray(history)) {
    const kept = (history as ArrivalEvent[]).filter(e => e.bookingKey !== key);
    if (kept.length !== history.length) store.setItem(ARRIVAL_HISTORY_KEY, JSON.stringify(kept));
  }
  return statuses;
}

export function findArrivalBookings(bookings: Booking[], regnr: string, date: string, statuses: Statuses) {
  const normalized = normalizeRegnr(regnr);
  if (!normalized) return [];
  return bookings.filter(b => b.date === date && normalizeRegnr(b.regnr) === normalized && statuses[statusKey(b)] !== "avbokad")
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Re-read before writing: never revive a removed or cancelled booking. */
export function registerArrival(store: Store, booking: Booking, now = new Date()): "registered" | "already" {
  if (booking.date !== localDate(now)) throw new Error("Du kan bara registrera ankomst för dagens bokning.");
  const current = readBookings(store).find(b => statusKey(b) === statusKey(booking));
  if (!current) throw new Error("Bokningen finns inte längre. Kontakta personalen.");
  const statuses = readStatuses(store);
  const key = statusKey(current);
  if (statuses[key] === "avbokad") throw new Error("Bokningen är avbokad. Kontakta personalen.");
  if (statuses[key] === "ankommen" || statuses[key] === "sen") return "already";
  const oldHistory = store.getItem(ARRIVAL_HISTORY_KEY);
  const history: ArrivalEvent[] = oldHistory ? JSON.parse(oldHistory) : [];
  if (!Array.isArray(history)) throw new Error("Ankomsthistoriken kunde inte läsas.");
  store.setItem(ARRIVAL_HISTORY_KEY, JSON.stringify([...history, { bookingKey: key, regnr: current.regnr, arrivedAt: now.toISOString() }]));
  try {
    store.setItem(STATUS_KEY, JSON.stringify({ ...statuses, [key]: "ankommen" }));
  } catch (error) {
    if (oldHistory === null) store.removeItem(ARRIVAL_HISTORY_KEY);
    else store.setItem(ARRIVAL_HISTORY_KEY, oldHistory);
    throw error;
  }
  return "registered";
}