import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; regnr: string; created_at: string; user_id: string; email: string; name: string; carOwner: string; carEmail: string; carPhone: string };

/** Bilar som kunder vill koppla men där kontaktuppgifterna inte stämde med billagret. Endast superadmin kan svara. */
export function PendingCars({ canApprove }: { canApprove: boolean }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState("");

  async function load() {
    const { data: links } = await supabase.from("customer_cars").select("id,regnr,created_at,user_id").eq("status", "vantar").order("created_at");
    const list = links ?? [];
    const ids = [...new Set(list.map((l) => l.user_id))];
    const regs = [...new Set(list.map((l) => l.regnr))];
    const [{ data: profs }, { data: cars }] = await Promise.all([
      ids.length ? supabase.from("profiles").select("id,email,display_name").in("id", ids) : Promise.resolve({ data: [] as { id: string; email: string | null; display_name: string | null }[] }),
      regs.length ? supabase.from("car_storage").select("regnr,owner,email,phone").in("regnr", regs) : Promise.resolve({ data: [] as { regnr: string; owner: string; email: string; phone: string }[] }),
    ]);
    setRows(list.map((l) => {
      const p = profs?.find((x) => x.id === l.user_id);
      const c = cars?.find((x) => x.regnr === l.regnr);
      return { ...l, email: p?.email ?? "", name: p?.display_name ?? "", carOwner: c?.owner ?? "", carEmail: c?.email ?? "", carPhone: c?.phone ?? "" };
    }));
  }
  useEffect(() => { load(); }, []);

  async function answer(id: string, status: "kopplad" | "nekad") {
    setBusy(id);
    await supabase.from("customer_cars").update({ status }).eq("id", id);
    setBusy("");
    load();
  }

  return (
    <section className="mb-10 rounded-md border bg-card p-5">
      <h2 className="mb-1 text-2xl font-semibold">Bilar som väntar på godkännande</h2>
      <p className="mb-4 text-sm text-muted-foreground">Kunden har lagt till bilen, men e-post eller telefon stämmer inte med billagret. Jämför uppgifterna innan du godkänner.</p>
      {rows === null ? <p className="text-sm text-muted-foreground">Hämtar…</p> : !rows.length ? <p className="text-sm text-muted-foreground">Inga bilar väntar just nu.</p> : (
        <ul className="divide-y rounded-md border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="text-sm">
                <p><span className="font-display text-lg font-bold tracking-widest">{r.regnr}</span> · begärd {new Date(r.created_at).toLocaleDateString("sv-SE")}</p>
                <p>Kund: <b>{r.name || "—"}</b> {r.email}</p>
                <p className="text-muted-foreground">I billagret: {r.carOwner || "—"} · {r.carEmail || "ingen e-post"} · {r.carPhone || "ingen telefon"}</p>
              </div>
              {canApprove && (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy === r.id} onClick={() => answer(r.id, "kopplad")}><Check />Godkänn</Button>
                  <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => answer(r.id, "nekad")}><X />Neka</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
