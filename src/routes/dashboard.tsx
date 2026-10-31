import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RequireRole } from "@/components/staff/require-role";
import { TopNav } from "@/components/top-nav";
import { supabase } from "@/integrations/supabase/client";
import { classifyService } from "@/lib/dashboard-stats";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard – Däckhotell" },
    { name: "description", content: "Grafisk översikt över bokningar, avbokningar, förvaringar och däcklager." },
    { property: "og:title", content: "Dashboard – Däckhotell" },
    { property: "og:description", content: "Bokningar per dag, vecka och månad samt däcklagrets fördelning." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <RequireRole roles={["superadmin", "useradmin", "mekaniker"]}><Dashboard /></RequireRole>,
});

type Period = "dag" | "vecka" | "manad";
type Row = { booking_key: string; booking_date: string; service: string | null };

function weekKey(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `v${Math.ceil(((t.getTime() - y.getTime()) / 864e5 + 1) / 7)}`;
}
function bucket(date: string, p: Period) {
  if (p === "dag") return date.slice(5);
  if (p === "vecka") return weekKey(new Date(date + "T12:00:00"));
  return date.slice(0, 7);
}
function tireType(typ: string) {
  const t = typ.toLowerCase();
  if (t.includes("dubb")) return "Vinter – dubb";
  if (t.includes("frik") || t.includes("vinter") || t.includes("nordic")) return "Vinter – friktion";
  if (t.includes("sommar") || t.includes("summer")) return "Sommar";
  return "Okänd";
}
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const [period, setPeriod] = useState<Period>("dag");
  const [bookings, setBookings] = useState<Row[]>([]);
  const [cancelled, setCancelled] = useState<Set<string>>(new Set());
  const [moved, setMoved] = useState<Set<string>>(new Set());
  const [storage, setStorage] = useState<{ tires: unknown }[]>([]);

  useEffect(() => {
    supabase.from("bookings").select("booking_key,booking_date,service").limit(10000).then(({ data }) => setBookings(data ?? []));
    supabase.from("booking_statuses").select("booking_key,status").limit(10000).then(({ data }) =>
      setCancelled(new Set((data ?? []).filter(s => s.status === "avbokad").map(s => s.booking_key))));
    supabase.from("status_events").select("booking_key,status").eq("status", "flyttad").limit(10000).then(({ data }) =>
      setMoved(new Set((data ?? []).map(s => s.booking_key))));
    supabase.from("car_storage").select("tires").limit(10000).then(({ data }) => setStorage(data ?? []));
  }, []);

  const chart = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - (period === "dag" ? 14 : period === "vecka" ? 84 : 365));
    const to = new Date(now);
    to.setDate(to.getDate() + (period === "dag" ? 14 : 28));
    const f = from.toISOString().slice(0, 10), t = to.toISOString().slice(0, 10);
    const map = new Map<string, { namn: string; Bokningar: number; Avbokningar: number; Ombokningar: number; "Nya förvaringar": number; "Avslutade förvaringar": number }>();
    for (const b of [...bookings].sort((a, z) => a.booking_date.localeCompare(z.booking_date))) {
      if (b.booking_date < f || b.booking_date > t) continue;
      const k = bucket(b.booking_date, period);
      const r = map.get(k) ?? { namn: k, Bokningar: 0, Avbokningar: 0, Ombokningar: 0, "Nya förvaringar": 0, "Avslutade förvaringar": 0 };
      if (cancelled.has(b.booking_key)) r.Avbokningar++;
      else {
        r.Bokningar++;
        const s = classifyService(b.service);
        if (s === "ny") r["Nya förvaringar"]++;
        if (s === "avsluta") r["Avslutade förvaringar"]++;
      }
      if (moved.has(b.booking_key)) r.Ombokningar++;
      map.set(k, r);
    }
    return [...map.values()];
  }, [bookings, cancelled, moved, period]);

  const totals = useMemo(() => chart.reduce((a, r) => ({
    b: a.b + r.Bokningar, c: a.c + r.Avbokningar, m: a.m + r.Ombokningar, n: a.n + r["Nya förvaringar"], e: a.e + r["Avslutade förvaringar"],
  }), { b: 0, c: 0, m: 0, n: 0, e: 0 }), [chart]);

  const tires = useMemo(() => {
    const count = new Map<string, number>();
    for (const car of storage) {
      const list = Array.isArray(car.tires) ? (car.tires as { typ?: string }[]) : [];
      const type = list.length ? tireType(list.map(x => x.typ ?? "").join(" ")) : "Okänd";
      count.set(type, (count.get(type) ?? 0) + 1);
    }
    return [...count.entries()].map(([name, value]) => ({ name, value }));
  }, [storage]);
  const winter = tires.filter(t => t.name.startsWith("Vinter")).reduce((a, t) => a + t.value, 0);

  const kpi = (label: string, v: number) => (
    <div className="rounded-lg border bg-card p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="font-display text-3xl">{v}</div></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <TopNav />
        <div className="mx-auto max-w-6xl px-6 py-6"><h1 className="font-display text-3xl uppercase tracking-wide">Dashboard</h1></div>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl uppercase">Bokningar</h2>
            <div className="flex gap-1 rounded-md border bg-card p-1">
              {(["dag", "vecka", "manad"] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`rounded px-4 py-2 text-sm ${period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {p === "dag" ? "Per dag" : p === "vecka" ? "Per vecka" : "Per månad"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {kpi("Bokningar", totals.b)}{kpi("Avbokningar", totals.c)}{kpi("Ombokningar", totals.m)}
            {kpi("Nya förvaringar", totals.n)}{kpi("Avslutade förvaringar", totals.e)}
          </div>
          <div className="h-80 rounded-lg border bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="namn" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
                <Tooltip /><Legend />
                {["Bokningar", "Avbokningar", "Ombokningar", "Nya förvaringar", "Avslutade förvaringar"].map((k, i) =>
                  <Bar key={k} dataKey={k} fill={COLORS[i]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-xl uppercase">Däcklager</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpi("Aktiva förvaringar", storage.length)}{kpi("Vinterdäck totalt", winter)}
            {kpi("Varav dubb", tires.find(t => t.name === "Vinter – dubb")?.value ?? 0)}
            {kpi("Sommardäck", tires.find(t => t.name === "Sommar")?.value ?? 0)}
          </div>
          <div className="h-80 rounded-lg border bg-card p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tires} dataKey="value" nameKey="name" outerRadius={110} label>
                  {tires.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
