import { useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAdmin } from "@/components/staff/user-admin";
import { SIGNAL_PRESETS, useSettings } from "@/lib/settings";

/** Samma inställningspanel oavsett var den visas: användare, logotyp, färger och företagsuppgifter. */
export function SettingsPanel() {
  const { settings, setSettings } = useSettings();
  const logoInput = useRef<HTMLInputElement>(null);

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
      <UserAdmin />

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
            <Input value={settings.company} onChange={(e) => setSettings((s) => ({ ...s, company: e.target.value }))} placeholder="Din verkstad" />
          </label>
          <label className="space-y-1 text-sm">Telefon
            <Input value={settings.phone} onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))} placeholder="031-000 00" />
          </label>
          <label className="space-y-1 text-sm">E-post
            <Input value={settings.email} onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))} placeholder="hej@verkstad.se" />
          </label>
          <label className="space-y-1 text-sm">Adress
            <Input value={settings.address} onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))} placeholder="Gatan 1, Ort" />
          </label>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSettings(DEFAULT_SETTINGS)}>Återställ inställningar</Button>
      </section>
    </div>
  );
}
