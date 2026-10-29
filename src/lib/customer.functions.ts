import { createServerFn } from "@tanstack/react-start";
import { loadScheduleServer } from "./schedule";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { endTimeFor, isBookable, stockholmNow, LEAD_HOURS } from "./booking-flow";
import { claimStatus, matchesContact, normPhone, type Contact } from "./customer-match";
import type { Tire } from "./bookings";

// Signed-in customer: only rows whose e-mail/phone match the customer (or bookings for their linked cars) are returned.
type Ctx = { supabase: any; userId: string; claims: { email?: string } };

async function contactOf(ctx: Ctx): Promise<Contact & { name: string; street: string; postalCode: string; city: string }> {
  const { data } = await ctx.supabase.from("profiles").select("display_name,phone,street,postal_code,city,email").eq("id", ctx.userId).maybeSingle();
  return { email: ctx.claims.email ?? data?.email ?? "", phone: data?.phone ?? "", name: data?.display_name ?? "",
    street: data?.street ?? "", postalCode: data?.postal_code ?? "", city: data?.city ?? "" };
}

async function load(me: Contact, userId?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const ors: string[] = [];
  if (me.email) ors.push(`email.ilike.${me.email.replace(/[,()%*]/g, "")}`);
  const p = normPhone(me.phone);
  if (p.length >= 7) ors.push(`phone.ilike.*${p.slice(-7)}*`);
  const { data: links } = userId ? await supabaseAdmin.from("customer_cars").select("regnr,status").eq("user_id", userId) : { data: [] };
  const linked = (links ?? []).filter(l => l.status === "kopplad").map(l => l.regnr);
  const pending = (links ?? []).filter(l => l.status === "vantar").map(l => l.regnr);
  if (!ors.length && !linked.length && !pending.length) return { cars: [], bookings: [], pending: [] as string[] };
  const { data: carRows } = ors.length ? await supabaseAdmin.from("car_storage").select("regnr,modell,lagerplats,min_depth,tires,email,phone").or(ors.join(",")) : { data: [] };
  const { data: linkedRows } = linked.length ? await supabaseAdmin.from("car_storage").select("regnr,modell,lagerplats,min_depth,tires,email,phone").in("regnr", linked) : { data: [] };
  const cars = (carRows ?? []).filter(c => matchesContact(me, c));
  for (const c of linkedRows ?? []) if (!cars.some(x => x.regnr === c.regnr)) cars.push(c);
  // Kopplade bilar som inte finns i billagret visas med bara regnumret.
  for (const r of linked) if (!cars.some(x => x.regnr === r)) cars.push({ regnr: r, modell: "", lagerplats: "", min_depth: null, tires: [], email: "", phone: "" });
  const regnrs = cars.map(c => c.regnr);
  const { data: byContact } = !ors.length ? { data: [] } : await supabaseAdmin.from("bookings").select("booking_key,regnr,booking_date,start_time,service,email,phone,name").or(ors.join(","));
  const { data: byCar } = regnrs.length ? await supabaseAdmin.from("bookings").select("booking_key,regnr,booking_date,start_time,service,email,phone,name").in("regnr", regnrs) : { data: [] };
  const map = new Map<string, NonNullable<typeof byContact>[number]>();
  for (const b of byContact ?? []) if (matchesContact(me, b)) map.set(b.booking_key, b);
  for (const b of byCar ?? []) map.set(b.booking_key, b);
  const keys = [...map.keys()];
  const { data: st } = keys.length ? await supabaseAdmin.from("booking_statuses").select("booking_key,status").in("booking_key", keys) : { data: [] };
  const status = new Map((st ?? []).map(s => [s.booking_key, s.status]));
  const bookings = [...map.values()].map(b => ({ key: b.booking_key, regnr: b.regnr, date: b.booking_date, time: b.start_time.slice(0, 5),
    service: b.service ?? "", status: status.get(b.booking_key) ?? "vantas" }))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return { cars: cars.map(c => ({ regnr: c.regnr, modell: c.modell, lagerplats: c.lagerplats,
    minDepth: c.min_depth == null ? null : Number(c.min_depth), tires: (Array.isArray(c.tires) ? c.tires : []) as unknown as Tire[] })), bookings, pending: pending.filter(r => !cars.some(c => c.regnr === r)) };
}

export const myCustomerPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await contactOf(context as Ctx);
    return { profile: me, ...(await load(me, context.userId)) };
  });

export const updateMyProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().trim().max(100), phone: z.string().trim().max(30),
    street: z.string().trim().max(150), postalCode: z.string().trim().max(10), city: z.string().trim().max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context as Ctx).supabase.from("profiles").update({ display_name: data.name || null, phone: data.phone || null,
      street: data.street || null, postal_code: data.postalCode || null, city: data.city || null }).eq("id", context.userId);
    return { ok: !error };
  });

/** At least 48 h before the appointment, matching the booking rule. */
function changeable(date: string, time: string) {
  const now = stockholmNow();
  const at = new Date(`${date}T${time}:00`);
  return at.getTime() - now.getTime() >= LEAD_HOURS * 3600 * 1000;
}

async function ownBooking(ctx: Ctx, key: string) {
  const me = await contactOf(ctx);
  const { bookings } = await load(me, ctx.userId);
  return bookings.find(b => b.key === key);
}

async function markCancelled(key: string, regnr: string, actor: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("booking_statuses").upsert({ booking_key: key, status: "avbokad", updated_by: actor, updated_at: new Date().toISOString() }, { onConflict: "booking_key" });
  await supabaseAdmin.from("status_events").insert({ booking_key: key, regnr, status: "avbokad", source: "kund", actor_id: actor });
}

export const cancelMyBooking = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string().max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const b = await ownBooking(context as Ctx, data.key);
    if (!b || b.status === "avbokad") return { ok: false as const, error: "Bokningen hittades inte." };
    if (!changeable(b.date, b.time)) return { ok: false as const, error: "Det är mindre än 48 timmar kvar. Ring verkstaden för att avboka." };
    await markCancelled(b.key, b.regnr, context.userId);
    return { ok: true as const };
  });

export const rebookMyBooking = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string().max(60), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    await loadScheduleServer();
    const b = await ownBooking(context as Ctx, data.key);
    if (!b || b.status === "avbokad") return { ok: false as const, error: "Bokningen hittades inte." };
    if (!changeable(b.date, b.time)) return { ok: false as const, error: "Det är mindre än 48 timmar kvar. Ring verkstaden för att boka om." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("bookings").select("booking_key,start_time").eq("booking_date", data.date);
    const k = (rows ?? []).map(r => r.booking_key);
    const { data: st } = k.length ? await supabaseAdmin.from("booking_statuses").select("booking_key,status").in("booking_key", k) : { data: [] };
    const off = new Set((st ?? []).filter(s => s.status === "avbokad").map(s => s.booking_key));
    const taken = (rows ?? []).filter(r => !off.has(r.booking_key)).map(r => r.start_time.slice(0, 5));
    if (!isBookable(data.date, data.time, stockholmNow(), taken)) return { ok: false as const, error: "Tiden är inte längre ledig. Välj en annan tid." };
    const { data: orig } = await supabaseAdmin.from("bookings").select("*").eq("booking_key", b.key).single();
    if (!orig) return { ok: false as const, error: "Bokningen hittades inte." };
    const newKey = `${data.date}|${data.time}|${b.regnr}`;
    const { error } = await supabaseAdmin.from("bookings").insert({ booking_key: newKey, regnr: b.regnr, name: orig.name, phone: orig.phone,
      email: orig.email, note: orig.note, service: orig.service, booking_date: data.date, start_time: data.time, end_time: endTimeFor(data.time), source: "kund" });
    if (error) return { ok: false as const, error: "Tiden kunde inte bokas. Försök med en annan tid." };
    await markCancelled(b.key, b.regnr, context.userId);
    await supabaseAdmin.from("status_events").insert({ booking_key: newKey, regnr: b.regnr, status: "ombokad", source: "kund", actor_id: context.userId });
    return { ok: true as const };
  });

/** Kunden kopplar ett regnummer till sitt konto. Finns bilen i billagret med andra kontaktuppgifter väntar kopplingen på personalens godkännande. */
export const claimMyCar = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ regnr: z.string().min(2).max(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const regnr = data.regnr.toUpperCase().replace(/[^A-Z0-9ÅÄÖ]/g, "");
    if (regnr.length < 2) return { ok: false as const, error: "Ange ett giltigt regnummer." };
    const me = await contactOf(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: car } = await supabaseAdmin.from("car_storage").select("email,phone").eq("regnr", regnr).maybeSingle();
    const status = claimStatus(me, car);
    const { data: existing } = await supabaseAdmin.from("customer_cars").select("status").eq("user_id", context.userId).eq("regnr", regnr).maybeSingle();
    if (!existing) {
      const { error } = await supabaseAdmin.from("customer_cars").insert({ user_id: context.userId, regnr, status });
      if (error) return { ok: false as const, error: "Kunde inte lägga till bilen. Försök igen." };
    }
    return { ok: true as const, regnr, status: (existing?.status ?? status) as "kopplad" | "vantar" };
  });
