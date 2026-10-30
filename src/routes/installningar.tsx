import { RequireRole } from "@/components/staff/require-role";
import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { SettingsPanel } from "@/components/settings-panel";
import { UserAdmin } from "@/components/staff/user-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeDollarSign, ScrollText, Gauge, CalendarClock, Database, Mail, Monitor, Settings, Users } from "lucide-react";
import { UserRoles } from "@/components/staff/role-gate";
import { useAuth } from "@/hooks/use-auth";
import { DataImport } from "@/components/staff/data-import";
import { PriceSettings } from "@/components/staff/price-settings";
import { TreadSettings } from "@/components/staff/tread-settings";
import { TermsSettings } from "@/components/staff/terms-settings";
import { ScheduleSettings } from "@/components/staff/schedule-settings";
import { MailSettings } from "@/components/staff/mail-settings";
import { ScreenSettingsPanel } from "@/components/staff/screen-settings";

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
  return <RequireRole roles={["superadmin", "useradmin"]}><SettingsGate /></RequireRole>;
}

// Användaradmin ser bara fliken Konto med formuläret för nya mekaniker-/kundkonton.
function SettingsGate() {
  const { hasRole } = useAuth();
  return <SettingsPage limited={!hasRole("superadmin")} />;
}

function SettingsPage({ limited }: { limited: boolean }) {
  return (
    <main className="min-h-screen">
      <header className="screen-only sticky top-0 z-50 shadow-md bg-primary text-primary-foreground">
        <TopNav />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-signal">Verkstad</p>
          <h1 className="text-5xl font-bold uppercase">Inställningar</h1>
        </div>
        <div className="h-2 bg-[repeating-linear-gradient(45deg,var(--signal)_0_16px,var(--primary)_16px_32px)]" />
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue={limited ? "konto" : "allmant"} className="space-y-6">
          <TabsList aria-label="Inställningsområden" className="h-auto flex-wrap justify-start">
            {!limited && <TabsTrigger value="allmant" className="gap-2"><Settings className="h-4 w-4" />Allmänt</TabsTrigger>}
            <TabsTrigger value="konto" className="gap-2"><Users className="h-4 w-4" />Konto</TabsTrigger>
            {!limited && <TabsTrigger value="bokningar" className="gap-2"><CalendarClock className="h-4 w-4" />Bokningar</TabsTrigger>}
            {!limited && <TabsTrigger value="priser" className="gap-2"><BadgeDollarSign className="h-4 w-4" />Priser</TabsTrigger>}
            {!limited && <TabsTrigger value="monsterdjup" className="gap-2"><Gauge className="h-4 w-4" />Mönsterdjup</TabsTrigger>}
            {!limited && <TabsTrigger value="villkor" className="gap-2"><ScrollText className="h-4 w-4" />Villkor</TabsTrigger>}
            {!limited && <TabsTrigger value="epost" className="gap-2"><Mail className="h-4 w-4" />E-post</TabsTrigger>}
            {!limited && <TabsTrigger value="skarmar" className="gap-2"><Monitor className="h-4 w-4" />Skärmar</TabsTrigger>}
            {!limited && <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" />Data &amp; import</TabsTrigger>}
          </TabsList>
          {!limited && <TabsContent value="allmant"><SettingsPanel /></TabsContent>}
          <TabsContent value="konto" className="space-y-8"><UserAdmin />{!limited && <AccountRoles />}</TabsContent>
          {!limited && <TabsContent value="bokningar"><ScheduleSettings /></TabsContent>}
          {!limited && <TabsContent value="priser"><PriceSettings /></TabsContent>}
          {!limited && <TabsContent value="monsterdjup"><TreadSettings /></TabsContent>}
          {!limited && <TabsContent value="villkor"><TermsSettings /></TabsContent>}
          {!limited && <TabsContent value="epost"><MailSettings /></TabsContent>}
          {!limited && <TabsContent value="skarmar"><ScreenSettingsPanel /></TabsContent>}
          {!limited && <TabsContent value="data"><DataImport /></TabsContent>}
        </Tabs>
      </div>
    </main>
  );
}

function AccountRoles() {
  const { user } = useAuth();
  return user ? <UserRoles selfId={user.id} /> : null;
}
