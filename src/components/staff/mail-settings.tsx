import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { sendTestMail } from "@/lib/mail.functions";

type Form = { host: string; port: string; username: string; password: string; from_address: string; site_url: string; enabled: boolean };
const EMPTY: Form = { host: "", port: "587", username: "", password: "", from_address: "", site_url: "", enabled: true };

/** Uppgifter för bekräftelsemail via verkstadens egen mejlserver. */
export function MailSettings() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);
  const test = useServerFn(sendTestMail);

  useEffect(() => {
    void supabase.from("mail_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setForm({ ...data, port: String(data.port) });
    });
  }, []);

  const set = (k: keyof Form, v: string | boolean) => { setMsg(null); setForm((f) => ({ ...f, [k]: v })); };

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("mail_settings").upsert({
      id: 1, host: form.host.trim(), port: Number(form.port) || 587, username: form.username.trim(), password: form.password,
      from_address: form.from_address.trim(), site_url: form.site_url.trim(), enabled: form.enabled, updated_at: new Date().toISOString(),
    });
    setBusy(false);
    setMsg(error ? { ok: false, text: "Kunde inte spara uppgifterna." } : { ok: true, text: "E-postinställningarna är sparade" });
  }

  async function runTest() {
    setBusy(true);
    const r = await test({ data: { to: testTo } });
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: `Testmejl skickat till ${testTo}` } : { ok: false, text: r.error });
  }

  return (
    <section className="space-y-4 rounded-md border bg-card p-5">
      <h2 className="font-display text-xl font-semibold uppercase">E-postutskick</h2>
      <p className="text-sm text-muted-foreground">Uppgifterna från ert mejlkonto (finns hos ert webbhotell). Används för bekräftelsemail när en kund bokar.</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4" />
        Skicka bekräftelsemail vid bokning
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Utgående server (SMTP)
          <Input value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="send.one.com" />
        </label>
        <label className="space-y-1 text-sm">Port
          <Input inputMode="numeric" value={form.port} onChange={(e) => set("port", e.target.value.replace(/\D/g, ""))} placeholder="587" />
        </label>
        <label className="space-y-1 text-sm">Användarnamn
          <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="bokning@dindomän.se" autoComplete="off" />
        </label>
        <label className="space-y-1 text-sm">Lösenord
          <PasswordInput value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
        </label>
        <label className="space-y-1 text-sm">Avsändaradress
          <Input value={form.from_address} onChange={(e) => set("from_address", e.target.value)} placeholder="bokning@dindomän.se" />
        </label>
        <label className="space-y-1 text-sm">Webbadress till sidan (för länken till Mina sidor)
          <Input value={form.site_url} onChange={(e) => set("site_url", e.target.value)} placeholder="https://bokningar.dindomän.se" />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Port 587 är vanligast. Port 465 används för SSL.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy}>Spara ändringar</Button>
        <Input className="w-64" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Din e-post för test" />
        <Button variant="outline" onClick={runTest} disabled={busy || !testTo}>Skicka testmejl</Button>
      </div>
      {msg && (
        <p className={`flex w-fit items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${msg.ok ? "bg-st-arrived text-foreground" : "bg-destructive/10 text-destructive"}`}>
          {msg.ok && <Check className="h-4 w-4" />}{msg.text}
        </p>
      )}
      <p className="text-xs text-muted-foreground">Spara först, skicka sedan testmejl. Utskick fungerar när appen körs på er egen server.</p>
    </section>
  );
}
