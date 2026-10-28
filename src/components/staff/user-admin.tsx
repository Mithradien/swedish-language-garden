import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { createUserWithRole } from "@/lib/users.functions";

export function UserAdmin() {
  const { user, loading, hasRole } = useAuth();
  const create = useServerFn(createUserWithRole);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "mekaniker" as AppRole });
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (!user || !hasRole("superadmin")) {
    return <section className="rounded-md border bg-card p-5"><h2 className="font-display text-xl font-semibold uppercase">Användare</h2><p className="text-sm text-muted-foreground">Logga in som superadmin för att skapa användare.</p></section>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Lösenordet måste vara minst 8 tecken"); return; }
    setBusy(true);
    try {
      await create({ data: form });
      toast.success(`${form.email} skapad – kan logga in direkt`);
      setForm({ name: "", email: "", password: "", role: "mekaniker" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte skapa användaren");
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-4 rounded-md border bg-card p-5">
      <h2 className="font-display text-xl font-semibold uppercase">Skapa användare</h2>
      <p className="text-sm text-muted-foreground">Alla användare, roller och lösenord hanteras under <Link to="/personal" className="underline">Personal</Link>.</p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Namn<Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="space-y-1 text-sm">E-post<Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="space-y-1 text-sm">Lösenord (minst 8 tecken)<Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label className="space-y-1 text-sm">Roll
          <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}>
            <option value="superadmin">Superadmin</option>
            <option value="mekaniker">Mekaniker</option>
            <option value="kund">Kund</option>
          </select>
        </label>
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Skapar…" : "Skapa användare"}</Button></div>
      </form>
    </section>
  );
}
