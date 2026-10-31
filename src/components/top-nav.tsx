import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, LayoutDashboard, LogIn, LogOut, Monitor, Settings, UserRound, Wrench } from "lucide-react";

const STAFF_MENU = [
  { id: "arbetslista", label: "Arbetslista" },
  { id: "plocklista", label: "Plocklista" },
  { id: "godkannande", label: "Godkännande" },
  { id: "verktyg", label: "Verktyg för kundbilar" },
] as const;
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { navItemsFor } from "@/lib/nav-access";

const LABEL: Record<AppRole, string> = { superadmin: "Superadmin", useradmin: "Useradmin", mekaniker: "Mekaniker", kund: "Kund", skarm: "Skärm" };

// En enda meny, used on every page, so it always sits in the same spot. Items follow the user's roles.
// hideAccount hides the area; logoutOnly shows only the log out button (no e-mail), used on the reception screen.
export function TopNav({ hideAccount = false, logoutOnly = false }: { hideAccount?: boolean; logoutOnly?: boolean }) {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const items = navItemsFor(user ? roles : []);
  const screens = items.filter(item => item.group === "screens");
  const customer = items.filter(item => item.group === "customer");
  const staff = items.some(item => item.group === "staff");
  const pathname = useRouterState({ select: state => state.location.pathname });
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  const link = "rounded-sm px-3 py-2.5 opacity-80 transition hover:bg-primary-foreground/10 hover:opacity-100";
  return (
    <nav aria-label="Huvudmeny" className="border-b border-primary-foreground/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-2 font-display text-sm uppercase tracking-wider">
        {items.filter(item => !item.group && item.to !== "/boka").map((item) => (
          <Link key={item.to} to={item.to} activeOptions={{ exact: true }} className={`${link} inline-flex items-center gap-2`}
            activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}>
            {item.to === "/dashboard" ? <LayoutDashboard className="h-4 w-4" /> : item.to === "/oversikt" ? <CalendarDays className="h-4 w-4" /> : null}
            {item.label}
          </Link>
        ))}
        {staff && <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className={`text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground uppercase ${pathname === "/personal" ? "bg-primary-foreground/15" : ""}`}><Wrench className="h-4 w-4" />Personal<ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">{STAFF_MENU.map(t => <DropdownMenuItem key={t.id} asChild><Link to="/personal" search={{ flik: t.id }} className="py-3"><Wrench className="h-4 w-4" />{t.label}</Link></DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>}
        {screens.length > 0 && <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className={`text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground uppercase ${screens.some(item => item.to === pathname) ? "bg-primary-foreground/15" : ""}`}><Monitor className="h-4 w-4" />Skärmar<ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">{screens.map(item => <DropdownMenuItem key={item.to} asChild><Link to={item.to} className="py-3"><Monitor className="h-4 w-4" />{item.label}</Link></DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>}
        {!hideAccount &&
        <div className="ml-auto flex items-center gap-1">
          {items.some(i => i.to === "/boka") && <Link to="/boka" className={link} activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}>Boka tid</Link>}
          {user ? (
            logoutOnly ? (
              <button type="button" onClick={signOut} className={`${link} inline-flex items-center gap-2 uppercase`}>
                <LogOut className="h-4 w-4" />Logga ut
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="uppercase text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><UserRound className="h-4 w-4" /><span className="hidden sm:inline">{roles[0] ? LABEL[roles[0]] : "Profil"}</span><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuLabel className="font-normal"><div className="text-sm">{user.email}</div>{roles[0] && <div className="text-xs text-muted-foreground">{LABEL[roles[0]]}</div>}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {customer.map(item => <DropdownMenuItem key={item.to} asChild><Link to={item.to} className="py-3">{item.to === "/installningar" ? <Settings className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}{item.label}</Link></DropdownMenuItem>)}
                  {customer.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onSelect={signOut} className="py-3"><LogOut className="h-4 w-4" />Logga ut</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <Link to="/logga-in" className={`${link} inline-flex items-center gap-2`}>
              <LogIn className="h-4 w-4" />Logga in
            </Link>
          )}
        </div>}
      </div>
    </nav>
  );
}
