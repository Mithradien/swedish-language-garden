import { supabase } from "@/integrations/supabase/client";
import { statusKey } from "@/lib/arrival";
import type { Booking, Service } from "@/lib/bookings";

/** Upload imported bookings to the shared database (superadmin only, enforced by RLS). Returns saved count or null. */
export async function syncBookingsToDb(bookings: Booking[]): Promise<number | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const rows = bookings.filter(b => b.regnr && b.date && b.start).map(b => ({
    booking_key: statusKey(b), regnr: b.regnr, name: b.name, phone: b.phone,
    booking_date: b.date, start_time: b.start, end_time: b.end, service: b.service,
    updated_at: new Date().toISOString(),
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("bookings").upsert(rows.slice(i, i + 500), { onConflict: "booking_key" });
    if (error) return null;
  }
  return rows.length;
}

export async function fetchBookingsForDate(date: string): Promise<Booking[]> {
  const { data } = await supabase.from("bookings").select("*").eq("booking_date", date).order("start_time");
  return (data ?? []).map(r => ({
    name: r.name ?? "", regnr: r.regnr, date: r.booking_date, dateLabel: r.booking_date,
    start: r.start_time, end: r.end_time ?? "", service: (r.service ?? "Okänd") as Service, phone: r.phone ?? "",
  }));
}
