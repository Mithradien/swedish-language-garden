import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { SettingsPanel } from "@/components/settings-panel";
import { UserAdmin } from "@/components/staff/user-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users } from "lucide-react";

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
  component: SettingsPage,
});

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
          </TabsList>
          <TabsContent value="allmant"><SettingsPanel /></TabsContent>
          <TabsContent value="konto"><UserAdmin /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
