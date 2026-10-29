import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TREAD_THRESHOLDS, TREAD_THRESHOLDS, TREAD_TITLES, validTread, type TireSeason } from "@/lib/tread";

type Limits = { orangeFrom: number; yellowFrom: number; greenFrom: number };
const FIELDS: { key: keyof Limits; label: string; dot: string }[] = [
  { key: "greenFrom", label: `Grönt (${TREAD_TITLES.green}) från`, dot: "bg-tread-green" },
  { key: "yellowFrom", label: `Gult (${TREAD_TITLES.yellow}) från`, dot: "bg-tread-yellow" },
  { key: "orangeFrom", label: `Orange (${TREAD_TITLES.orange}) från`, dot: "bg-tread-orange" },
];
const SEASONS: { key: TireSeason; label: string }[] = [{ key: "summer", label: "Sommardäck" }, { key: "winter", label: "Vinterdäck" }];
const copy = (t: Record<TireSeason, Limits>) => ({ summer: { ...t.summer }, winter: { ...t.winter } });

/** Inställningar → Mönsterdjup: färggränser per säsong. Under orange-gränsen blir det rött. */
export function TreadSettings() {
  const [t, setT] = useState(() => copy(TREAD_THRESHOLDS));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = validTread(t);

  async function save() {
    if (!valid) return;
    setBusy(true);
    const { error } = await supabase.from("app_config").upsert({ key: "tread", value: valid as never, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: "Kunde inte spara. Försök igen." }); return; }
    setMsg({ ok: true, text: "Gränserna är sparade" });
    window.dispatchEvent(new Event("schedule-changed"));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Ange från hur många millimeter varje färg gäller. Under orange-gränsen visas rött ({TREAD_TITLES.red}).</p>
      <div className="grid gap-4 md:grid-cols-2">
        {SEASONS.map((s) => (
          <section key={s.key} className="space-y-3 rounded-md border bg-card p-5">
            <h2 className="font-display text-xl font-semibold uppercase">{s.label}</h2>
            {FIELDS.map((f) => (
              <label key={f.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${f.dot}`} />{f.label}</span>
                <span className="flex items-center gap-2">
                  <Input type="number" step={0.1} min={0} max={15} className="w-24" value={t[s.key][f.key]}
                    onChange={(e) => { setMsg(null); const v = Number(e.target.value); setT((p) => ({ ...p, [s.key]: { ...p[s.key], [f.key]: v } })); }} />
                  mm
                </span>
              </label>
            ))}
          </section>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={!valid || busy}>Spara gränser</Button>
        <Button variant="outline" onClick={() => { setMsg(null); setT(copy(DEFAULT_TREAD_THRESHOLDS)); }}>Återställ till standard</Button>
        {!valid && <span className="text-sm text-destructive">Grönt måste vara högre än gult, och gult högre än orange.</span>}
        {msg && (
          <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${msg.ok ? "bg-st-arrived text-foreground" : "text-destructive"}`}>
            {msg.ok && <Check className="h-4 w-4" />}{msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
