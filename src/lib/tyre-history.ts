import type { Database } from "@/integrations/supabase/types";
type Order = Database["public"]["Tables"]["work_orders"]["Row"];
export type TyreVisit = Pick<Order, "id" | "booking_key" | "regnr" | "booking_date" | "finished_at" | "service" | "depth_vf" | "depth_hf" | "depth_vb" | "depth_hb" | "tire_season" | "fitted_tire_set">;
export type HistoryOrder = TyreVisit & { status: string };
export function completedTyreHistory(orders: HistoryOrder[], bookingKeys: string[]): TyreVisit[] {
  const owned = new Set(bookingKeys);
  return orders.filter(o => owned.has(o.booking_key) && o.status === "klar" && o.finished_at && /skifte/i.test(o.service ?? ""))
    .sort((a,b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""))
    .map(({ status: _status, ...visit }) => visit);
}
export function depthChange(current: number | null, previous: number | null) {
  return current == null || previous == null ? null : Math.round((current - previous) * 10) / 10;
}
export function previousTyreVisit(visit: TyreVisit, visits: TyreVisit[]) {
  if (!visit.tire_season || !visit.fitted_tire_set?.trim()) return undefined;
  return visits.find(v => v.regnr === visit.regnr && v.tire_season === visit.tire_season && v.fitted_tire_set?.trim().toLowerCase() === visit.fitted_tire_set?.trim().toLowerCase() && (v.finished_at ?? "") < (visit.finished_at ?? ""));
}