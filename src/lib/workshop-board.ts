import type { Database } from "@/integrations/supabase/types";

export type BoardBooking = Pick<Database["public"]["Tables"]["bookings"]["Row"], "booking_key" | "regnr" | "start_time" | "service">;
export type BoardStage = "vantas" | "ankommen" | "paborjad" | "klar";
export type BoardCar = BoardBooking & { stage: BoardStage; arrival: string; lagerplats: string };
export const BOARD_STAGES = ["vantas", "ankommen", "paborjad", "klar"] as const;

export function workshopDay(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function buildWorkshopBoard(
  bookings: BoardBooking[],
  statuses: { booking_key: string; status: string }[],
  orders: { booking_key: string; status: string }[],
  storage: { regnr: string; lagerplats: string }[],
): BoardCar[] {
  const arrivals = new Map(statuses.map(s => [s.booking_key, s.status]));
  const work = new Map(orders.map(o => [o.booking_key, o.status]));
  const places = new Map(storage.map(s => [s.regnr.replace(/\s/g, "").toUpperCase(), s.lagerplats]));
  return bookings.filter(b => arrivals.get(b.booking_key) !== "avbokad").map(b => {
    const arrival = arrivals.get(b.booking_key) ?? "vantas";
    const order = work.get(b.booking_key);
    const stage: BoardStage = order === "klar" ? "klar" : order === "paborjad" ? "paborjad" : arrival === "ankommen" || arrival === "sen" ? "ankommen" : "vantas";
    return { ...b, arrival, stage, lagerplats: places.get(b.regnr.replace(/\s/g, "").toUpperCase()) ?? "" };
  }).sort((a, b) => a.start_time.localeCompare(b.start_time) || a.regnr.localeCompare(b.regnr));
}