import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { localDate, readBookings, statusKey } from "@/lib/arrival";
import type { Booking } from "@/lib/bookings";

type Order = Database["public"]["Tables"]["work_orders"]["Row"];
const WHEELS = [["depth_vf", "VF"], ["depth_hf", "HF"], ["depth_vb", "VB"], ["depth_hb", "HB"]] as const;
const STATUS_LABEL: Record<string, string> = { ej_paborjad: "Ej påbörjad", paborjad: "Påbörjad", klar: "Klar" };

export function MechanicView({ userId }: { userId: string }) {
  const [date, setDate] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { setDate(localDate()); setBookings(readBookings(window.localStorage)); }, []);
  const list = useMemo(() => bookings.filter(b => b.date === date).sort((a, b) => a.start.localeCompare(b.start)), [bookings, date]);

  async function load() {
    if (!date) return;
    const { data } = await supabase.from("work_orders").select("*").eq("booking_date", date);
    setOrders(Object.fromEntries((data ?? []).map(o => [o.booking_key, o])));
  }
  useEffect(() => { load(); }, [date]);

  async function save(b: Booking, patch: Partial<Order>) {
    const key = statusKey(b);
    const now = new Date().toISOString();
    const row = { booking_key: key, regnr: b.regnr, booking_date: b.date, service: b.service, mechanic_id: userId, updated_at: now, ...patch };
    const { data, error } = await supabase.from("work_orders").upsert(row, { onConflict: "booking_key" }).select().single();
    if (!error && data) setOrders(o => ({ ...o, [key]: data }));
    return !error;
  }

  return <div className="mx-auto max-w-4xl px-5 py-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-3xl font-bold">Arbetslista</h1>
      <label className="text-sm font-medium">Dag<Input type="date" className="mt-1" value={date} onChange={e => setDate(e.target.value)}/></label>
    </div>
    {!list.length && <p className="text-muted-foreground">Inga bokningar denna dag. Bokningarna hämtas från filen som lästs in i Bokningsöversikten på den här enheten.</p>}
    <ul className="divide-y border-y">
      {list.map(b => {
        const key = statusKey(b); const o = orders[key]; const status = o?.status ?? "ej_paborjad";
        return <li key={key} className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-14 font-mono">{b.start}</span>
            <span className="w-28 rounded border px-2 py-1 text-center font-display text-lg font-bold">{b.regnr}</span>
            <span className="flex-1 text-sm">{b.service}</span>
            <span className={`rounded px-2 py-1 text-xs font-medium ${status === "klar" ? "bg-tread-green/20" : status === "paborjad" ? "bg-tread-yellow/30" : "bg-secondary"}`}>{STATUS_LABEL[status]}</span>
            {status === "ej_paborjad" && <Button size="sm" onClick={() => save(b, { status: "paborjad", started_at: new Date().toISOString() })}>Påbörja</Button>}
            {status === "paborjad" && <Button size="sm" onClick={() => save(b, { status: "klar", finished_at: new Date().toISOString() })}>Klar</Button>}
            <Button size="sm" variant="outline" onClick={() => setOpen(open === key ? null : key)}>Protokoll</Button>
          </div>
          {open === key && <Protocol order={o} onSave={patch => save(b, patch)}/>}
        </li>;
      })}
    </ul>
  </div>;
}

function Protocol({ order, onSave }: { order?: Order; onSave: (p: Partial<Order>) => Promise<boolean> }) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(WHEELS.map(([k]) => [k, order?.[k] != null ? String(order[k]) : ""])));
  const [note, setNote] = useState(order?.note ?? "");
  const [msg, setMsg] = useState("");
  const num = (s: string) => { const n = parseFloat(s.replace(",", ".")); return Number.isFinite(n) ? n : null; };
  return <form className="mt-4 rounded-md border bg-secondary/40 p-4" onSubmit={async e => {
    e.preventDefault();
    const ok = await onSave({ ...Object.fromEntries(WHEELS.map(([k]) => [k, num(vals[k])])), note: note || null });
    setMsg(ok ? "Protokollet är sparat." : "Kunde inte spara.");
  }}>
    <p className="mb-3 text-sm font-medium">Mönsterdjup (mm)</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {WHEELS.map(([k, label]) => <label key={k} className="text-sm">{label}<Input inputMode="decimal" className="mt-1" value={vals[k]} onChange={e => setVals({ ...vals, [k]: e.target.value })}/></label>)}
    </div>
    <label className="mt-3 block text-sm">Notering<textarea className="mt-1 w-full rounded-md border bg-background p-2" rows={2} value={note} onChange={e => setNote(e.target.value)}/></label>
    <div className="mt-3 flex items-center gap-3"><Button type="submit" size="sm">Spara protokoll</Button>{msg && <span role="status" className="text-sm">{msg}</span>}</div>
  </form>;
}
