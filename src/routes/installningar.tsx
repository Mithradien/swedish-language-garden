import { RequireRole } from "@/components/staff/require-role";
import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { SettingsPanel } from "@/components/settings-panel";
import { UserAdmin } from "@/components/staff/user-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Settings, Users } from "lucide-react";
import { UserRoles } from "@/components/staff/role-gate";
import { useAuth } from "@/hooks/use-auth";
import { DataImport } from "@/components/staff/data-import";

export const Route = createFileRoute("/installningar")({
  head: () => ({
    meta: [
      { title: "Inställningar – logotyp, färger och företagsuppgifter" },
      { name: "description", content: "Ställ in logotyp, färger, företagsuppgifter och personalens åtkomst i bokningssystemet." },
      { property: "og:title", content: "Inställningar" },
      { property: "og:description", content: "Logotyp, färger, företagsuppgifter och användare med roller." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuardedSettings,
});

function GuardedSettings() {
  return <RequireRole roles={["superadmin"]}><SettingsPage /></RequireRole>;
}

function SettingsPage() {
  return (
    <main className="min-h-screen">
      <header className="screen-only bg-primary text-primary-foreground">
        <TopNav />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-signal">Verkstad</p>
          <h1 className="text-5xl font-bold uppercase">Inställningar</h1>
        </div>
        <div className="h-2 bg-[repeating-linear-gradient(45deg,var(--signal)_0_16px,var(--primary)_16px_32px)]" />
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="allmant" className="space-y-6">
          <TabsList aria-label="Inställningsområden">
            <TabsTrigger value="allmant" className="gap-2"><Settings className="h-4 w-4" />Allmänt</TabsTrigger>
            <TabsTrigger value="konto" className="gap-2"><Users className="h-4 w-4" />Konto</TabsTrigger>
            <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" />Data &amp; import</TabsTrigger>
          </TabsList>
          <TabsContent value="allmant"><SettingsPanel /></TabsContent>
          <TabsContent value="konto" className="space-y-8"><UserAdmin /><AccountRoles /></TabsContent>
          <TabsContent value="data"><DataImport /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function AccountRoles() {
  const { user } = useAuth();
  return user ? <UserRoles selfId={user.id} /> : null;
}
