import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { StaffPreview } from "@/components/customer/staff-preview";
import { TopNav } from "@/components/top-nav";
import { MechanicView } from "./mechanic-view";

const LABEL: Record<AppRole, string> = { superadmin: "Superadmin", mekaniker: "Mekaniker", kund: "Kund" };

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen"><div className="bg-primary text-primary-foreground"><TopNav/></div><div className="mx-auto max-w-4xl px-5 py-10">{children}</div></main>;
}

export function StaffArea() {
  const { user, roles, loading, hasRole } = useAuth();
  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading) return <Shell><p className="text-muted-foreground">Laddar…</p></Shell>;
  if (!user) return <Shell><h1 className="mb-3 text-3xl font-bold">Personal</h1><p className="mb-6 text-muted-foreground">Logga in för att se personalens vy.</p><Button asChild><Link to="/logga-in">Logga in</Link></Button></Shell>;

  const bar = <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-b px-5 py-3 text-sm"><span>Inloggad som <b>{user.email}</b> · {roles.map(r => LABEL[r]).join(", ") || "ingen roll"}</span><Button variant="outline" size="sm" onClick={signOut}>Logga ut</Button></div>;

  if (hasRole("superadmin")) return <><div className="bg-primary text-primary-foreground"><TopNav/></div>{bar}<div className="mx-auto max-w-6xl px-5 pt-8"><UserRoles selfId={user.id}/></div><MechanicView userId={user.id}/><StaffPreview embedded/></>;
  if (hasRole("mekaniker")) return <><div className="bg-primary text-primary-foreground"><TopNav/></div>{bar}<MechanicView userId={user.id}/></>;
  return <><div className="bg-primary text-primary-foreground"><TopNav/></div>{bar}<div className="mx-auto max-w-4xl px-5 py-10"><h1 className="mb-3 text-3xl font-bold">Ingen personalbehörighet</h1><p className="text-muted-foreground">Ditt konto är ett kundkonto. Be en superadmin ge dig en personalroll.</p></div></>;
}

type Row = { id: string; email: string | null; display_name: string | null; roles: AppRole[] };

export function UserRoles({ selfId }: { selfId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  async function load() {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,email,display_name").order("created_at"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    setRows((profiles ?? []).map(p => ({ ...p, roles: (roles ?? []).filter(r => r.user_id === p.id).map(r => r.role) })));
  }
  useEffect(() => { load(); }, []);

  async function setRole(userId: string, role: AppRole) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
    load();
  }

  return <section className="mb-10"><h2 className="mb-4 text-2xl font-semibold">Användare och roller</h2><div className="divide-y border-y">
    {rows.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{r.display_name || r.email}</p><p className="text-sm text-muted-foreground">{r.email}</p></div>
      {r.id === selfId ? <span className="text-sm">{r.roles.map(x => LABEL[x]).join(", ")} (du)</span> :
        <select aria-label={`Roll för ${r.email}`} className="rounded-md border bg-background px-3 py-2 text-sm" value={r.roles[0] ?? "kund"} onChange={e => setRole(r.id, e.target.value as AppRole)}>
          {(Object.keys(LABEL) as AppRole[]).map(k => <option key={k} value={k}>{LABEL[k]}</option>)}
        </select>}
    </div>)}
  </div></section>;
}
