import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBookingsForDate } from "@/lib/booking-sync";
import { fetchCarStorage } from "@/lib/car-storage-sync";
import { fetchDbStatuses } from "@/lib/status-sync";
import { statusKey, localDate } from "@/lib/arrival";
import { buildPickList, nextDay, type PickRow } from "@/lib/pick-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PickList() {
  const [date, setDate] = useState(() => nextDay(localDate()));
  const [rows, setRows] = useState<PickRow[] | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setRows(null);
    (async () => {
      const [bookings, cards, statuses, { data: picks }] = await Promise.all([
        fetchBookingsForDate(date), fetchCarStorage(), fetchDbStatuses(),
        supabase.from("pick_checks").select("booking_key").like("booking_key", `${date}|%`),
      ]);
      if (!alive) return;
      const cancelled = new Set(Object.entries(statuses ?? {}).filter(([, s]) => s === "avbokad").map(([k]) => k));
      setRows(buildPickList(bookings, cards ?? new Map(), cancelled, statusKey));
      setChecked(new Set((picks ?? []).map(p => p.booking_key)));
    })();
    return () => { alive = false; };
  }, [date]);

  async function toggle(key: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const next = new Set(checked);
    if (checked.has(key)) { next.delete(key); await supabase.from("pick_checks").delete().eq("booking_key", key); }
    else { next.add(key); await supabase.from("pick_checks").insert({ booking_key: key, checked_by: u.user.id }); }
    setChecked(next);
  }

  const done = useMemo(() => rows?.filter(r => checked.has(r.key)).length ?? 0, [rows, checked]);

  return <section className="mb-10 print-area">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-2xl font-semibold">Plocklista</h2><p className="text-sm text-muted-foreground">Hjul att plocka fram från förvaringen, sorterat efter lagerplats.</p></div>
      <div className="flex items-center gap-2 print:hidden">
        <Input type="date" aria-label="Datum" value={date} onChange={e => e.target.value && setDate(e.target.value)} className="w-auto"/>
        <Button variant="outline" onClick={() => window.print()}>Skriv ut</Button>
      </div>
    </div>
    {rows === null ? <p className="text-muted-foreground">Laddar…</p> : rows.length === 0 ? <p className="text-muted-foreground">Inga hjul att plocka fram den här dagen.</p> : <>
      <p className="mb-2 text-sm font-medium">{done} av {rows.length} framplockade</p>
      <div className="divide-y rounded-lg border">
        {rows.map(r => {
          const on = checked.has(r.key);
          return <label key={r.key} className={`flex cursor-pointer items-center gap-4 px-4 py-3 ${on ? "bg-muted text-muted-foreground" : ""}`}>
            <input type="checkbox" className="size-6 accent-primary" checked={on} onChange={() => toggle(r.key)} aria-label={`Plockad ${r.regnr}`}/>
            <span className="w-24 text-xl font-bold">{r.lagerplats}</span>
            <span className={`flex-1 ${on ? "line-through" : ""}`}><b>{r.regnr}</b> {r.modell && `· ${r.modell}`}<br/><span className="text-sm text-muted-foreground">{r.start} · {r.name} · {r.service}</span></span>
          </label>;
        })}
      </div>
    </>}
  </section>;
}
