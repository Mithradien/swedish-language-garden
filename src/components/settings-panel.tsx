import { useRef, useState, type ChangeEvent } from "react";
import { Check, Upload } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SETTINGS, SIGNAL_PRESETS, useSettings } from "@/lib/settings";

/** Gemensam panel för logotyp, färger och företagsuppgifter. */
export function SettingsPanel() {
  const { settings, setSettings } = useSettings();
  const logoInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Partial<Settings>>({});
  const [savedMsg, setSavedMsg] = useState(false);
  const dirty = Object.keys(draft).length > 0;
  type TextKey = "company" | "phone" | "email" | "address" | "postalCode" | "city" | "swish" | "vatNr" | "bic" | "iban" | "bankgiro";
  const val = (k: TextKey) => (draft[k] as string | undefined) ?? settings[k];
  const edit = (k: TextKey, v: string) => { setSavedMsg(false); setDraft((d) => ({ ...d, [k]: v })); };
  function save() {
    setSettings((s) => ({ ...s, ...draft }));
    setDraft({});
    setSavedMsg(true);
  }

  async function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(f);
    });
    setSettings((s) => ({ ...s, logo: dataUrl }));
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3 rounded-md border bg-card p-5">
          <h2 className="font-display text-xl font-semibold uppercase">Logotyp</h2>
          {settings.logo ? (
            <div className="space-y-3">
              <img src={settings.logo} alt="Er logotyp" className="h-24 w-auto max-w-full rounded-md border bg-background p-2 object-contain" />
              <Button variant="outline" size="sm" onClick={() => setSettings((s) => ({ ...s, logo: "" }))}>Ta bort logotyp</Button>
            </div>
          ) : (
            <label className="group flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed bg-background p-4 transition hover:border-primary">
              <div className="min-w-0 flex-1 font-display uppercase">Välj bild</div>
              <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <input ref={logoInput} type="file" accept="image/*" className="sr-only" onChange={onLogo} />
            </label>
          )}
          <p className="text-sm text-muted-foreground">Logotypen visas överst på sidan och sparas i den här webbläsaren.</p>
        </section>

        <section className="space-y-3 rounded-md border bg-card p-5">
          <h2 className="font-display text-xl font-semibold uppercase">Färger</h2>
          <div className="flex flex-wrap items-center gap-2">
            {SIGNAL_PRESETS.map((p) => (
              <button key={p.hex} type="button" title={p.name}
                onClick={() => setSettings((s) => ({ ...s, signal: p.hex }))}
                className={`h-10 w-10 rounded-md border-2 ${settings.signal.toLowerCase() === p.hex ? "border-foreground" : "border-border"}`}
                style={{ background: p.hex }} />
            ))}
            <label className="flex items-center gap-2 text-sm">
              Egen
              <input type="color" value={settings.signal}
                onChange={(e) => setSettings((s) => ({ ...s, signal: e.target.value }))}
                className="h-10 w-14 cursor-pointer rounded-md border bg-background" />
            </label>
          </div>
          <p className="text-sm text-muted-foreground">Färgen används för markeringar, rast-rader och lagerplats.</p>
        </section>
      </div>

      <section className="space-y-4 rounded-md border bg-card p-5">
        <h2 className="font-display text-xl font-semibold uppercase">Företagsuppgifter</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">Namn
            <Input value={val("company")} onChange={(e) => edit("company", e.target.value)} placeholder="Din verkstad" />
          </label>
          <label className="space-y-1 text-sm">Telefon
            <Input value={val("phone")} onChange={(e) => edit("phone", e.target.value)} placeholder="031-000 00" />
          </label>
          <label className="space-y-1 text-sm">E-post
            <Input value={val("email")} onChange={(e) => edit("email", e.target.value)} placeholder="hej@verkstad.se" />
          </label>
          <label className="space-y-1 text-sm">Gatuadress
            <Input value={val("address")} onChange={(e) => edit("address", e.target.value)} placeholder="Gatan 1" />
          </label>
          {([
            ["postalCode", "Postnummer", "123 45"],
            ["city", "Postort", "Ort"],
            ["swish", "Swish", "123 456 78 90"],
            ["vatNr", "VAT-nr (momsreg.nr)", "SE556677889901"],
            ["bic", "BIC (SWIFT)", "ESSESESS"],
            ["iban", "IBAN", "SE00 0000 0000 0000 0000 0000"],
            ["bankgiro", "Bankgiro", "123-4567"],
          ] as const).map(([key, label, ph]) => (
            <label key={key} className="space-y-1 text-sm">{label}
              <Input value={val(key)} onChange={(e) => edit(key, e.target.value)} placeholder={ph} />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={!dirty}>Spara ändringar</Button>
          {dirty && <Button variant="ghost" onClick={() => setDraft({})}>Ångra</Button>}
          {dirty && <span className="text-sm text-muted-foreground">Du har ändringar som inte är sparade.</span>}
          {savedMsg && !dirty && <span className="flex items-center gap-1 rounded-md bg-st-arrived px-2 py-1 text-sm font-medium text-foreground"><Check className="h-4 w-4" />Ändringarna är sparade</span>}
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setDraft({}); setSettings(() => DEFAULT_SETTINGS); }}>Återställ inställningar</Button>
        </div>
      </section>
    </div>
  );
}
