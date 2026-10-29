import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_INSURANCE_TEXT, DEFAULT_SPECIAL_TERMS, parseTerms } from "@/lib/storage-terms";

/** Inställningar → Villkor: försäkringstext och särskilda villkor på förvaringsbeviset. */
export function TermsSettings() {
  const [insurance, setInsurance] = useState(DEFAULT_INSURANCE_TEXT);
  const [special, setSpecial] = useState(DEFAULT_SPECIAL_TERMS.join("\n"));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("app_config").select("value").eq("key", "storage_terms").maybeSingle().then(({ data }) => {
      const t = parseTerms(data?.value);
      setInsurance(t.insurance);
      setSpecial(t.special.join("\n"));
    });
  }, []);

  async function save() {
    setBusy(true);
    const value = { insurance: insurance.trim(), special: special.split("\n").map((l) => l.trim()).filter(Boolean) };
    const { error } = await supabase.from("app_config").upsert({ key: "storage_terms", value, updated_at: new Date().toISOString() });
    setBusy(false);
    setMsg(error ? { ok: false, text: "Kunde inte spara. Försök igen." } : { ok: true, text: "Villkoren är sparade" });
  }

  const edit = <T,>(fn: (v: T) => void) => (v: T) => { setMsg(null); fn(v); };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-md border bg-card p-5">
        <h2 className="font-display text-xl font-semibold uppercase">Försäkring och ansvar</h2>
        <Textarea rows={6} value={insurance} onChange={(e) => edit(setInsurance)(e.target.value)} />
      </section>
      <section className="space-y-3 rounded-md border bg-card p-5">
        <h2 className="font-display text-xl font-semibold uppercase">Särskilda villkor</h2>
        <p className="text-sm text-muted-foreground">Ett villkor per rad. Varje rad blir en punkt på förvaringsbeviset.</p>
        <Textarea rows={8} value={special} onChange={(e) => edit(setSpecial)(e.target.value)} />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy}>Spara villkor</Button>
        <Button variant="outline" onClick={() => { setMsg(null); setInsurance(DEFAULT_INSURANCE_TEXT); setSpecial(DEFAULT_SPECIAL_TERMS.join("\n")); }}>Återställ förslag</Button>
        {msg && <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${msg.ok ? "bg-st-arrived text-foreground" : "text-destructive"}`}>{msg.ok && <Check className="h-4 w-4" />}{msg.text}</span>}
      </div>
    </div>
  );
}
