import { applySchedule } from "./bookings";

/** Läser bokningsschemat (Inställningar → Bokningar) och gör det aktuellt. Saknas det gäller standardschemat. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadSchedule(client: any) {
  const { data } = await client.from("app_config").select("value").eq("key", "schedule").maybeSingle();
  applySchedule(data?.value ?? null);
}

/** Servern: läs schemat inne i handlern innan tider kontrolleras. */
export async function loadScheduleServer() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await loadSchedule(supabaseAdmin);
}
