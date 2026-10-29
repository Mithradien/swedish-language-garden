import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { myStorageRenewals, renewMyStorage } from "@/lib/customer.functions";
import { DEFAULT_PRICES, tierLabel } from "@/lib/prices";
import { parseTerms } from "@/lib/storage-terms";
import { renewalSeasonLabel, renewalSeasons } from "@/lib/storage-renewal";

type Data = Awaited<ReturnType<typeof myStorageRenewals>>;
export function StorageRenewal({ cars, example = false }: { cars: { regnr: string; lagerplats: string }[]; example?: boolean }) {
  const fetch = useServerFn(myStorageRenewals);
  const renew = useServerFn(renewMyStorage);
  const [data, setData] = useState<Data | null>(null);
  const [regnr, setRegnr] = useState("");
  const [season, setSeason] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const available = cars.filter(c => c.lagerplats.trim());
  async function reload() {
    if (example) { setData(previous => previous ?? { terms: parseTerms(null), prices: DEFAULT_PRICES, version: "example", renewals: [], seasons: renewalSeasons() }); return; }
    try { setData(await fetch()); setError(""); } catch { setError("Förnyelserna kunde inte hämtas."); }
  }
  useEffect(() => { void reload(); }, [example]);
  async function open(r: string) {
    setAccepted(false); setMessage(""); setSeason("");
    await reload(); setRegnr(r);
  }
  async function submit() {
    if (!data || !accepted || !season) return;
    setBusy(true); setError("");
    try {
      if (example) {
        setData({ ...data, renewals: [{ id: crypto.randomUUID(), regnr, season, accepted_at: new Date().toISOString() }, ...data.renewals] });
      } else {
        const result = await renew({ data: { regnr, season, accepted: true, version: data.version } });
        if (!result.ok) { setError(result.error); return; }
        await reload();
      }
      setMessage(`${example ? "Exempel: " : ""}Förvaringen för ${regnr}, ${renewalSeasonLabel(season)}, är godkänd.${example ? " Inget har skickats till verkstaden." : " Verkstaden kan se ditt godkännande."}`);
      setRegnr("");
    } catch { setError("Förnyelsen kunde inte sparas. Försök igen."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 border-t pt-6">
    <h2 className="text-2xl font-semibold">Förnya förvaringen</h2>
    {message && <p role="status" className="text-sm text-svc-forvaring">{message}</p>}
    {error && !regnr && <p role="alert" className="text-sm text-destructive">{error} <Button variant="link" onClick={reload}>Försök igen</Button></p>}
    {!available.length && <p className="text-sm text-muted-foreground">Inga hjul i förvaring är kopplade till ditt konto.</p>}
    <ul className="divide-y">{available.map(c => <li key={c.regnr} className="flex flex-wrap items-center justify-between gap-3 py-3"><b>{c.regnr}</b><Button variant="outline" disabled={!data} onClick={() => void open(c.regnr)}><RefreshCw/>Förnya förvaring</Button></li>)}</ul>
    {!!data?.renewals.length && <div><h3 className="mb-2 font-semibold">Godkända förvaringssäsonger</h3><ul className="divide-y text-sm">{data.renewals.map(r => <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2"><span><b>{r.regnr}</b> · {renewalSeasonLabel(r.season)}</span><span className="text-muted-foreground">Godkänd {new Date(r.accepted_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", dateStyle: "short", timeStyle: "short" })}</span></li>)}</ul></div>}
    <Dialog open={!!regnr} onOpenChange={o => { if (!o && !busy) { setRegnr(""); setError(""); } }}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Förnya förvaring · {regnr}</DialogTitle><DialogDescription>{example ? "Exempeluppgifter – inget sparas hos verkstaden." : "Godkännande för en ny förvaringssäsong. Ingen skiftestid bokas och ingen betalning görs här."}</DialogDescription></DialogHeader>
      {data && <><label className="space-y-2 text-sm font-medium"><span>Förvaringssäsong</span><Select value={season} onValueChange={v => { setSeason(v); setAccepted(false); }}><SelectTrigger><SelectValue placeholder="Välj säsong"/></SelectTrigger><SelectContent>{data.seasons.filter(s => !data.renewals.some(r => r.regnr === regnr && r.season === s)).map(s => <SelectItem key={s} value={s}>{renewalSeasonLabel(s)}</SelectItem>)}</SelectContent></Select></label>
        <div className="space-y-4 border-y py-4 text-sm"><div><h3 className="mb-2 font-semibold">Försäkring och ansvar</h3><p className="whitespace-pre-line">{data.terms.insurance}</p></div><div><h3 className="mb-2 font-semibold">Särskilda villkor</h3><ul className="list-disc space-y-1 pl-5">{data.terms.special.map(t => <li key={t}>{t}</li>)}</ul></div><div><h3 className="mb-2 font-semibold">Gällande prislista · Skifte och förvaring</h3><ul>{(data.prices["Skifte och förvaring"] ?? []).map((t, i, all) => <li key={i} className="flex justify-between gap-3 py-1"><span>{tierLabel(all, i)}</span><b>{t.price} kr</b></li>)}</ul></div></div>
        <label className="flex items-start gap-3 text-sm"><Checkbox aria-label="Jag godkänner villkoren för den valda förvaringssäsongen" checked={accepted} onCheckedChange={v => setAccepted(v === true)} className="mt-0.5"/><span>Jag godkänner villkoren för den valda förvaringssäsongen.</span></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={!accepted || !season || busy}><Check/>{busy ? "Sparar…" : "Godkänn ny förvaringssäsong"}</Button></>}
    </DialogContent></Dialog>
  </section>;
}