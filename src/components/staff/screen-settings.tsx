import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ARRIVAL_STATUSES, DEFAULT_SCREEN, parseScreenSettings } from "@/lib/screen-settings";
import { BOARD_STAGES } from "@/lib/workshop-board";

export function ScreenSettingsPanel() {
  const [value, setValue] = useState(() => parseScreenSettings(null));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void supabase.from("app_config").select("value").eq("key", "screens").maybeSingle().then(r => { if (r.error) setError("Kunde inte hämta skärminställningarna."); else setValue(parseScreenSettings(r.data?.value)); setLoading(false); }); }, []);
  if (loading) return <p>Hämtar skärminställningar…</p>;
  async function save() {
    if (!value.title.trim() || BOARD_STAGES.some(k => !value.columns[k].label.trim()) || !BOARD_STAGES.some(k => value.columns[k].visible) || !value.statuses.length) { setError("Ange rubriker och välj minst en kolumn och en status."); return; }
    setBusy(true); setError(""); setMessage("");
    const { error } = await supabase.from("app_config").upsert({ key: "screens", value: parseScreenSettings(value) as unknown as Json, updated_at: new Date().toISOString() });
    setBusy(false); if (error) setError("Kunde inte spara skärminställningarna."); else setMessage("Skärminställningarna är sparade.");
  }
  return <section className="max-w-4xl space-y-6"><h2 className="text-2xl font-semibold">Kundmottagningens skärm</h2>
    <div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Skärmens rubrik<Input value={value.title} maxLength={60} onChange={e => setValue({ ...value, title: e.target.value })}/></label><label className="space-y-2 text-sm font-medium">Uppdatering (sekunder)<Input type="number" min={5} max={300} value={value.interval} onChange={e => setValue({ ...value, interval: Number(e.target.value) })}/></label></div>
    <fieldset className="space-y-3 border-y py-5"><legend className="font-semibold">Synliga ankomststatusar</legend><div className="flex flex-wrap gap-5">{Object.entries(ARRIVAL_STATUSES).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><Checkbox checked={value.statuses.includes(key)} onCheckedChange={checked => setValue({ ...value, statuses: checked ? [...value.statuses, key] : value.statuses.filter(s => s !== key) })}/>{label}</label>)}</div></fieldset>
    <div className="space-y-4">{BOARD_STAGES.map(key => <div key={key} className="grid items-end gap-3 border-b pb-4 sm:grid-cols-[auto_1fr_160px]"><label className="flex h-9 items-center gap-2 text-sm"><Switch aria-label={`Visa ${DEFAULT_SCREEN.columns[key].label}`} checked={value.columns[key].visible} onCheckedChange={visible => setValue({ ...value, columns: { ...value.columns, [key]: { ...value.columns[key], visible } } })}/>Visa</label><label className="space-y-2 text-sm">{DEFAULT_SCREEN.columns[key].label} – rubrik<Input maxLength={60} value={value.columns[key].label} onChange={e => setValue({ ...value, columns: { ...value.columns, [key]: { ...value.columns[key], label: e.target.value } } })}/></label><label className="space-y-2 text-sm">Antal (0 = alla)<Input type="number" min={0} max={100} value={value.columns[key].limit} onChange={e => setValue({ ...value, columns: { ...value.columns, [key]: { ...value.columns[key], limit: Number(e.target.value) } } })}/></label></div>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-svc-forvaring">{message}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={save}><Check/>{busy ? "Sparar…" : "Spara ändringar"}</Button><Button variant="outline" disabled={busy} onClick={() => { setValue(parseScreenSettings(null)); setMessage(""); }}><RotateCcw/>Återställ standardvärden</Button></div>
  </section>;
}