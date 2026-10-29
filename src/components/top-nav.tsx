import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogIn, LogOut, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { navItemsFor } from "@/lib/nav-access";

const LABEL: Record<AppRole, string> = { superadmin: "Superadmin", useradmin: "Användaradmin", mekaniker: "Mekaniker", kund: "Kund" };

// En enda meny, used on every page, so it always sits in the same spot. Items follow the user's roles.
export function TopNav({ hideAccount = false }: { hideAccount?: boolean }) {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const items = navItemsFor(user ? roles : []);
  const screens = items.filter(item => item.group === "screens");
  const pathname = useRouterState({ select: state => state.location.pathname });
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  const link = "rounded-sm px-3 py-2.5 opacity-80 transition hover:bg-primary-foreground/10 hover:opacity-100";
  return (
    <nav aria-label="Huvudmeny" className="border-b border-primary-foreground/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-2 font-display text-sm uppercase tracking-wider">
        {items.filter(item => item.group !== "screens").map((item) => (
          <Link key={item.to} to={item.to} activeOptions={{ exact: true }} className={link}
            activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}>
            {item.label}
          </Link>
        ))}
        {screens.length > 0 && <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className={`text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground uppercase ${screens.some(item => item.to === pathname) ? "bg-primary-foreground/15" : ""}`}><Monitor className="h-4 w-4" />Skärmar<ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">{screens.map(item => <DropdownMenuItem key={item.to} asChild><Link to={item.to} className="py-3"><Monitor className="h-4 w-4" />{item.label}</Link></DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>}
        {!hideAccount &&
        <div className="ml-auto flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="hidden normal-case tracking-normal opacity-80 sm:inline">
                {user.email}{roles[0] ? ` · ${LABEL[roles[0]]}` : ""}
              </span>
              <button type="button" onClick={signOut} className={`${link} inline-flex items-center gap-2 uppercase`}>
                <LogOut className="h-4 w-4" />Logga ut
              </button>
            </>
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
