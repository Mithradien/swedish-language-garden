import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SLOT_STEP, DEFAULT_WORK_PASSES, SLOT_STEP, WORK_PASSES, validSchedule } from "@/lib/bookings";

const toLabel = (v: number) => `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
const toMin = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
const STEPS = [10, 15, 20, 30, 45, 60];

/** Inställningar → Bokningar: arbetspass (första och sista starttid) och hur tätt tiderna ligger. */
export function ScheduleSettings() {
  const [passes, setPasses] = useState(() => WORK_PASSES.map(([a, b]) => [toLabel(a), toLabel(b)] as [string, string]));
  const [step, setStep] = useState(SLOT_STEP);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const cfg = validSchedule({ passes: passes.map(([a, b]) => [toMin(a), toMin(b)]), step });
  const times = cfg ? cfg.passes.flatMap(([a, b]) => { const o: string[] = []; for (let t = a; t <= b; t += cfg.step) o.push(toLabel(t)); return o; }) : [];

  const set = (i: number, j: 0 | 1, v: string) => { setMsg(null); setPasses((p) => p.map((x, k) => (k === i ? (j === 0 ? [v, x[1]] : [x[0], v]) : x))); };

  async function save() {
    if (!cfg) return;
    setBusy(true);
    const { error } = await supabase.from("app_config").upsert({ key: "schedule", value: cfg, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: "Kunde inte spara. Försök igen." }); return; }
    setMsg({ ok: true, text: "Bokningstiderna är sparade" });
    window.dispatchEvent(new Event("schedule-changed"));
  }

  function reset() {
    setMsg(null);
    setPasses(DEFAULT_WORK_PASSES.map(([a, b]) => [toLabel(a), toLabel(b)]));
    setStep(DEFAULT_SLOT_STEP);
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-md border bg-card p-5">
        <h2 className="font-display text-xl font-semibold uppercase">Arbetspass</h2>
        <p className="text-sm text-muted-foreground">Ange första och sista starttid för varje pass. Mellanrummet mellan passen blir rast. Varje bokning är 30 minuter.</p>
        <div className="space-y-2">
          {passes.map(([a, b], i) => (
            <div key={i} className="flex flex-wrap items-end gap-3">
              <span className="w-16 pb-2 text-sm font-medium">Pass {i + 1}</span>
              <label className="space-y-1 text-sm">Första tid<Input type="time" value={a} onChange={(e) => set(i, 0, e.target.value)} className="w-32" /></label>
              <label className="space-y-1 text-sm">Sista tid<Input type="time" value={b} onChange={(e) => set(i, 1, e.target.value)} className="w-32" /></label>
              {passes.length > 1 && (
                <Button variant="ghost" size="icon" aria-label={`Ta bort pass ${i + 1}`} onClick={() => { setMsg(null); setPasses((p) => p.filter((_, k) => k !== i)); }}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { setMsg(null); setPasses((p) => [...p, ["16:00", "17:00"]]); }}><Plus className="h-4 w-4" />Lägg till pass</Button>
        <label className="block space-y-1 text-sm">Ny tid var
          <select value={step} onChange={(e) => { setMsg(null); setStep(Number(e.target.value)); }} className="ml-2 h-10 rounded-md border bg-background px-3">
            {STEPS.map((s) => <option key={s} value={s}>{s} minut</option>)}
          </select>
        </label>
      </section>

      <section className="space-y-3 rounded-md border bg-card p-5">
        <h2 className="font-display text-xl font-semibold uppercase">Förhandsvisning – {times.length} tider per dag</h2>
        {cfg ? (
          <div className="flex flex-wrap gap-2">{times.map((t) => <span key={t} className="rounded-md border bg-background px-2 py-1 font-mono text-sm">{t}</span>)}</div>
        ) : (
          <p className="text-sm text-destructive">Kontrollera tiderna – sista tid får inte vara före första tid.</p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={save} disabled={!cfg || busy}>Spara bokningstider</Button>
          <Button variant="outline" onClick={reset}>Återställ till standard</Button>
          {msg && (
            <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${msg.ok ? "bg-st-arrived text-foreground" : "text-destructive"}`}>
              {msg.ok && <Check className="h-4 w-4" />}{msg.text}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
