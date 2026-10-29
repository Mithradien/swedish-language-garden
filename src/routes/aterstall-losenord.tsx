import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { TopNav } from "@/components/top-nav";

export const Route = createFileRoute("/aterstall-losenord")({
  head: () => ({ meta: [
    { title: "Nytt lösenord – Däckhotell" },
    { name: "description", content: "Välj ett nytt lösenord till ditt konto på däckhotellet." },
    { property: "og:title", content: "Nytt lösenord – Däckhotell" },
    { property: "og:description", content: "Välj ett nytt lösenord." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg("Kunde inte byta lösenord. Länken kan ha gått ut – begär en ny.");
    navigate({ to: "/kund" });
  }
  return <main className="min-h-screen"><div className="bg-primary text-primary-foreground"><TopNav/></div>
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 px-5 py-12"><h1 className="text-3xl font-bold">Välj nytt lösenord</h1>
      <label className="block text-sm font-medium">Nytt lösenord<PasswordInput className="mt-1" minLength={8} value={pw} onChange={e => setPw(e.target.value)} required/></label>
      <Button type="submit" className="w-full">Spara lösenord</Button>{msg && <p role="status" className="text-sm">{msg}</p>}</form></main>;
}
