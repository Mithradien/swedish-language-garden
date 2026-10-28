import { createFileRoute } from "@tanstack/react-router";
import { Boka } from "@/components/booking/boka-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boka däckskifte och förvaring – Däckhotell" },
      { name: "description", content: "Boka tid för däckskifte, förvaring eller avslut av förvaring i några enkla steg." },
      { property: "og:title", content: "Boka däckskifte och förvaring – Däckhotell" },
      { property: "og:description", content: "Ange regnummer, välj tid och bekräfta din bokning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Boka,
});
