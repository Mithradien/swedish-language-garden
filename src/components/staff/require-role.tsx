import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { TopNav } from "@/components/top-nav";

// Hides a staff page unless the signed-in user has one of the roles (read from the database).
export function RequireRole({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { user, loading, roles: mine } = useAuth();
  if (!loading && user && roles.some((r) => mine.includes(r))) return <>{children}</>;
  return (
    <main className="min-h-screen">
      <div className="screen-only sticky top-0 z-50 bg-primary text-primary-foreground shadow-md"><TopNav /></div>
      <div className="mx-auto max-w-md px-5 py-12">
        {loading ? <p className="text-muted-foreground">Laddar…</p> : !user ? (
          <><h1 className="mb-3 text-3xl font-bold">Logga in</h1><p className="mb-6 text-muted-foreground">Sidan är bara för verkstadens personal.</p><Button asChild><Link to="/logga-in">Logga in</Link></Button></>
        ) : (
          <><h1 className="mb-3 text-3xl font-bold">Ingen behörighet</h1><p className="text-muted-foreground">Ditt konto har inte tillgång till den här sidan.</p></>
        )}
      </div>
    </main>
  );
}
