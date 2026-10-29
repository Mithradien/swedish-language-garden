import { createFileRoute } from "@tanstack/react-router";
import { Boka } from "@/components/booking/boka-page";

export const Route = createFileRoute("/boka")({
  head: () => ({
    meta: [
      { title: "Boka tid – Däckhotell" },
      { name: "description", content: "Kundens bokningsflöde: ange regnummer, svara på två däckfrågor, välj dag och tid och bekräfta." },
      { property: "og:title", content: "Boka tid – Däckhotell" },
      { property: "og:description", content: "Boka däckskifte eller förvaring i några enkla steg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { regnr?: string } => (typeof s.regnr === "string" ? { regnr: s.regnr.slice(0, 10) } : {}),
  component: Boka,
});
