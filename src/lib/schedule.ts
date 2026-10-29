import { applySchedule } from "./bookings";
import { applyPrices } from "./prices";
import { applyTread } from "./tread";

/** Läser bokningsschemat (Inställningar → Bokningar) och gör det aktuellt. Saknas det gäller standardschemat. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadSchedule(client: any) {
  const { data } = await client.from("app_config").select("key,value").in("key", ["schedule", "prices", "tread"]);
  const rows = (data ?? []) as { key: string; value: unknown }[];
  applySchedule(rows.find((r) => r.key === "schedule")?.value ?? null);
  applyPrices(rows.find((r) => r.key === "prices")?.value ?? null);
  applyTread(rows.find((r) => r.key === "tread")?.value ?? null);
}

/** Servern: läs schemat inne i handlern innan tider kontrolleras. */
export async function loadScheduleServer() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await loadSchedule(supabaseAdmin);
}
