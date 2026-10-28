import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { SettingsPanel } from "@/components/settings-panel";

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
        <SettingsPanel />
      </div>
    </main>
  );
}
