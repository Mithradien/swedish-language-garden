import { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { StaffPreview } from "@/components/customer/staff-preview";
import { TopNav } from "@/components/top-nav";
import { PendingCars } from "./pending-cars";
import { CarTools } from "./car-tools";
import { PickList } from "./pick-list";
import { MechanicView } from "./mechanic-view";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { setUserPassword } from "@/lib/users.functions";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import { ACCOUNT_GROUPS, accountGroup, accountMatches, type AccountRow, type AccountGroup } from "@/lib/account-directory";
import { matchesContact } from "@/lib/customer-match";

const LABEL: Record<AppRole, string> = { superadmin: "Superadmin", useradmin: "Användaradmin", mekaniker: "Mekaniker", kund: "Kund", skarm: "Skärm" };

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen"><div className="screen-only sticky top-0 z-50 bg-primary text-primary-foreground shadow-md"><TopNav/></div><div className="mx-auto max-w-4xl px-5 py-10">{children}</div></main>;
}

export const STAFF_TABS = [
  { id: "arbetslista", label: "Arbetslista" },
  { id: "plocklista", label: "Plocklista" },
  { id: "godkannande", label: "Godkännande" },
  { id: "verktyg", label: "Verktyg för kundbilar" },
] as const;

export function StaffArea() {
  const { user, roles, loading, hasRole } = useAuth();
  const search = useSearch({ strict: false }) as { flik?: string };
  const tab = STAFF_TABS.some(t => t.id === search.flik) ? search.flik : "arbetslista";
  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading) return <Shell><p className="text-muted-foreground">Laddar…</p></Shell>;
  if (!user) return <Shell><h1 className="mb-3 text-3xl font-bold">Personal</h1><p className="mb-6 text-muted-foreground">Logga in för att se personalens vy.</p><Button asChild><Link to="/logga-in">Logga in</Link></Button></Shell>;

  const bar = <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-b px-5 py-3 text-sm"><span>Inloggad som <b>{user.email}</b> · {roles.map(r => LABEL[r]).join(", ") || "ingen roll"}</span><Button variant="outline" size="sm" onClick={signOut}>Logga ut</Button></div>;

  const readOnly = !hasRole("superadmin") && !hasRole("useradmin");
  if (hasRole("superadmin") || hasRole("useradmin") || hasRole("mekaniker")) return <><div className="screen-only sticky top-0 z-50 bg-primary text-primary-foreground shadow-md"><TopNav/></div>{bar}
    <div className="screen-only mx-auto flex max-w-6xl flex-wrap gap-2 px-5 pt-6">{STAFF_TABS.map(t => <Link key={t.id} to="/personal" search={{ flik: t.id }} className={`rounded-md border px-4 py-2.5 text-sm font-medium ${tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{t.label}</Link>)}</div>
    {tab === "arbetslista" && <MechanicView userId={user.id}/>}
    <div className="mx-auto max-w-6xl px-5 pt-8">{tab === "godkannande" && <PendingCars canApprove={!readOnly}/>}{tab === "plocklista" && <PickList/>}{tab === "verktyg" && <CarTools/>}</div>
    {tab === "arbetslista" && hasRole("superadmin") && <StaffPreview embedded/>}</>;
  return <><div className="screen-only sticky top-0 z-50 bg-primary text-primary-foreground shadow-md"><TopNav/></div>{bar}<div className="mx-auto max-w-4xl px-5 py-10"><h1 className="mb-3 text-3xl font-bold">Ingen personalbehörighet</h1><p className="text-muted-foreground">Ditt konto är ett kundkonto. Be en superadmin ge dig en personalroll.</p></div></>;
}

export function UserRoles({ selfId, readOnly = false }: { selfId: string; readOnly?: boolean }) {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<AccountGroup>("admins");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      // Page through every source so large customer lists remain searchable.
      async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
        const result: T[] = [];
        for (let from = 0; ; from += 1000) {
          const response = await page(from, from + 999);
          if (response.error) throw new Error(response.error.message);
          const batch = response.data ?? [];
          result.push(...batch);
          if (batch.length < 1000) return result;
        }
      }
      const [profiles, roles, cars, storage, bookings] = await Promise.all([
        all((from, to) => supabase.from("profiles").select("id,email,display_name,phone,street,postal_code,city").order("id").range(from, to)),
        all((from, to) => supabase.from("user_roles").select("user_id,role").order("id").range(from, to)),
        all((from, to) => supabase.from("customer_cars").select("user_id,regnr").eq("status", "kopplad").order("id").range(from, to)),
        all((from, to) => supabase.from("car_storage").select("regnr,modell,email,phone").order("regnr").range(from, to)),
        all((from, to) => supabase.from("bookings").select("regnr,email,phone").order("id").range(from, to)),
      ]);
      setRows(profiles.map(p => {
        const contact = { email: p.email ?? "", phone: p.phone ?? "" };
        const registrations = new Set(cars.filter(c => c.user_id === p.id).map(c => c.regnr));
        for (const car of [...storage, ...bookings]) if (matchesContact(contact, car)) registrations.add(car.regnr);
        return { ...p, roles: roles.filter(r => r.user_id === p.id).map(r => r.role), registrations: [...registrations].sort(), models: storage.filter(c => registrations.has(c.regnr)).map(c => c.modell).filter(Boolean) };
      }).sort((a, b) => (a.display_name || a.email || "").localeCompare(b.display_name || b.email || "", "sv")));
    } catch { setError("Kunde inte hämta kontolistan. Försök igen."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function setRole(userId: string, role: AppRole) {
    const removed = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (removed.error) { toast.error("Kunde inte ändra rollen"); return; }
    const added = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (added.error) toast.error("Kunde inte spara den nya rollen");
    await load();
  }

  const matching = rows.filter(r => accountMatches(r, search));
  const visible = matching.filter(r => accountGroup(r.roles) === group);
  return <section className="mb-10 space-y-4"><h2 className="text-2xl font-semibold">Användare och roller</h2>{readOnly && <p className="text-sm text-muted-foreground">Endast superadmin kan ändra roller och lösenord.</p>}
    <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Sök konton" placeholder="Namn, e-post, regnummer, telefon, ort eller bilmodell" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-10" />{search && <Button aria-label="Rensa sökning" title="Rensa sökning" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setSearch("")}><X className="h-4 w-4" /></Button>}</div>
    <Tabs value={group} onValueChange={v => setGroup(v as AccountGroup)}><TabsList aria-label="Kontokategorier" className="h-auto flex-wrap justify-start">{ACCOUNT_GROUPS.map(g => <TabsTrigger key={g.id} value={g.id} className="gap-2">{g.label}<span className="text-xs text-muted-foreground">{matching.filter(r => accountGroup(r.roles) === g.id).length}</span></TabsTrigger>)}</TabsList></Tabs>
    {loading ? <p className="text-sm text-muted-foreground">Laddar konton…</p> : error ? <div role="alert" className="flex items-center gap-3"><p className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={load}>Försök igen</Button></div> : <div className="divide-y border-y">
    {visible.length === 0 && <p className="py-6 text-sm text-muted-foreground">{search ? "Inga konton matchar sökningen i den här fliken." : "Inga konton i den här fliken."}</p>}
    {visible.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0 space-y-1"><p className="break-words font-medium">{r.display_name || r.email}</p><p className="break-all text-sm text-muted-foreground">{r.email}</p>{(r.phone || r.city) && <p className="text-sm text-muted-foreground">{[r.phone, r.city].filter(Boolean).join(" · ")}</p>}{r.registrations.length > 0 && <p className="max-w-xl break-words text-sm">{r.registrations.join(", ")}</p>}</div>
      {r.id === selfId ? <div className="flex flex-wrap items-center gap-2">{!readOnly && <PasswordButton userId={r.id} email={r.email ?? ""}/>}<span className="text-sm">{r.roles.map(x => LABEL[x]).join(", ")} (du)</span></div> :
        readOnly ? <span className="text-sm">{r.roles.map(x => LABEL[x]).join(", ") || "Ingen roll"}</span> :
        <div className="flex flex-wrap items-center gap-2"><PasswordButton userId={r.id} email={r.email ?? ""}/><select aria-label={`Roll för ${r.email}`} className="rounded-md border bg-background px-3 py-2 text-sm" value={r.roles[0] ?? "kund"} onChange={e => setRole(r.id, e.target.value as AppRole)}>
          {(Object.keys(LABEL) as AppRole[]).map(k => <option key={k} value={k}>{LABEL[k]}</option>)}
        </select></div>}
    </div>)}
  </div>}</section>;
}

function PasswordButton({ userId, email }: { userId: string; email: string }) {
  const setPw = useServerFn(setUserPassword);
  const [open, setOpen] = useState(false);
  const [pw, setPwValue] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Byt lösenord</Button>;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Lösenordet måste vara minst 8 tecken"); return; }
    setBusy(true);
    try { await setPw({ data: { userId, password: pw } }); toast.success(`Nytt lösenord sparat för ${email}`); setOpen(false); setPwValue(""); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Kunde inte byta lösenord"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="flex items-center gap-2">
    <input type="text" autoComplete="new-password" aria-label={`Nytt lösenord för ${email}`} placeholder="Nytt lösenord (minst 8)" minLength={8} required
      className="h-9 w-48 rounded-md border bg-background px-3 text-sm" value={pw} onChange={e => setPwValue(e.target.value)}/>
    <Button type="submit" size="sm" disabled={busy}>{busy ? "Sparar…" : "Spara"}</Button>
    <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setPwValue(""); }}>Avbryt</Button>
  </form>;
}
