import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { TopNav } from "@/components/top-nav";

export const Route = createFileRoute("/logga-in")({
  head: () => ({ meta: [
    { title: "Logga in – Däckhotell" },
    { name: "description", content: "Logga in eller skapa konto för personal och kunder på däckhotellet." },
    { property: "og:title", content: "Logga in – Däckhotell" },
    { property: "og:description", content: "Inloggning för personal och kunder." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    if (mode === "up" && confirm !== password) { setBusy(false); return setMsg("Lösenorden stämmer inte överens."); }
    if (mode === "in") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg("Fel e-post eller lösenord, eller kontot är inte bekräftat än.");
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const staff = (r ?? []).some(x => x.role === "superadmin" || x.role === "mekaniker");
      navigate({ to: staff ? "/oversikt" : "/kund" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/personal", data: { display_name: name } } });
      setBusy(false);
      setMsg(error ? "Kunde inte skapa kontot: " + error.message : "Kolla din e-post och klicka på länken för att bekräfta kontot.");
    }
  }

  return <main className="min-h-screen"><div className="bg-primary text-primary-foreground"><TopNav/></div>
    <div className="mx-auto max-w-sm px-5 py-12">
      <h1 className="mb-6 text-3xl font-bold">{mode === "in" ? "Logga in" : "Skapa konto"}</h1>
      <form onSubmit={submit} className="space-y-4">
        {mode === "up" && <label className="block text-sm font-medium">Namn<Input className="mt-1" value={name} onChange={e => setName(e.target.value)} required/></label>}
        <label className="block text-sm font-medium">E-post<Input className="mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} required/></label>
        <label className="block text-sm font-medium">Lösenord<PasswordInput className="mt-1" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required/></label>
        {mode === "up" && <label className="block text-sm font-medium">Bekräfta lösenord<PasswordInput className="mt-1" minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} required/></label>}
        <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Logga in" : "Skapa konto"}</Button>
      </form>
      {msg && <p role="status" className="mt-4 rounded-md border bg-secondary p-3 text-sm">{msg}</p>}
      <button type="button" className="mt-6 text-sm underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
        {mode === "in" ? "Inget konto? Skapa ett" : "Har du redan konto? Logga in"}
      </button>
    </div></main>;
}
