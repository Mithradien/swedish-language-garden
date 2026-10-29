import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PRICES, PRICE_LIST, PRICE_SERVICES, tierLabel, validPrices, type PriceList } from "@/lib/prices";

const clone = (l: PriceList): PriceList => JSON.parse(JSON.stringify(l));

/** Inställningar → Priser: pris per tjänst och fälgstorlek. */
export function PriceSettings() {
  const [list, setList] = useState<PriceList>(() => clone(PRICE_LIST));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = validPrices(list);

  const update = (s: string, fn: (t: PriceList[string]) => PriceList[string]) => {
    setMsg(null);
    setList((l) => ({ ...l, [s]: fn(l[s] ?? []) }));
  };

  async function save() {
    if (!valid) return;
    setBusy(true);
    const { error } = await supabase.from("app_config").upsert({ key: "prices", value: valid as never, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: "Kunde inte spara. Försök igen." }); return; }
    setList(clone(valid));
    setMsg({ ok: true, text: "Prislistan är sparad" });
    window.dispatchEvent(new Event("schedule-changed"));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Finns bilen hos er ser kunden exakt pris efter fälgstorlek. Annars visas "från"-priset. Sista raden gäller alltid storleken och uppåt.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {PRICE_SERVICES.map((s) => {
          const tiers = list[s] ?? [];
          return (
            <section key={s} className="space-y-3 rounded-md border bg-card p-5">
              <h2 className="font-display text-xl font-semibold uppercase">{s}</h2>
              {tiers.map((t, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  {t.upTo !== null ? (
                    <label className="space-y-1 text-sm">Upp till (tum)
                      <Input type="number" min={10} max={30} value={t.upTo} className="w-24"
                        onChange={(e) => update(s, (ts) => ts.map((x, k) => (k === i ? { ...x, upTo: Number(e.target.value) } : x)))} />
                    </label>
                  ) : (
                    <span className="w-24 pb-2 text-sm">{tierLabel(tiers, i)}</span>
                  )}
                  <label className="space-y-1 text-sm">Pris (kr)
                    <Input type="number" min={0} value={t.price} className="w-28"
                      onChange={(e) => update(s, (ts) => ts.map((x, k) => (k === i ? { ...x, price: Number(e.target.value) } : x)))} />
                  </label>
                  {t.upTo !== null && <span className="pb-2 text-sm text-muted-foreground">{tierLabel(tiers, i)}</span>}
                  {t.upTo !== null && (
                    <Button variant="ghost" size="icon" aria-label="Ta bort prissteg" onClick={() => update(s, (ts) => ts.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-2" onClick={() => update(s, (ts) => {
                const fixed = ts.filter((x) => x.upTo !== null);
                const top = ts.find((x) => x.upTo === null) ?? { upTo: null, price: 0 };
                const last = fixed[fixed.length - 1]?.upTo ?? 16;
                return [...fixed, { upTo: last + 1, price: top.price }, top];
              })}><Plus className="h-4 w-4" />Lägg till storlek</Button>
            </section>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={!valid || busy}>Spara prislista</Button>
        <Button variant="outline" onClick={() => { setMsg(null); setList(clone(DEFAULT_PRICES)); }}>Återställ till standard</Button>
        {!valid && <span className="text-sm text-destructive">Kontrollera storlekarna – de måste vara mellan 10 och 30 tum.</span>}
        {msg && (
          <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${msg.ok ? "bg-st-arrived text-foreground" : "text-destructive"}`}>
            {msg.ok && <Check className="h-4 w-4" />}{msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
