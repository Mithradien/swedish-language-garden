import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/staff/require-role";
import { WorkshopBoard } from "@/components/staff/workshop-board";

export const Route = createFileRoute("/verkstad")({
  head: () => ({ meta: [
    { title: "Verkstadsskärm – Däckhotell" },
    { name: "description", content: "Dagens verkstadsflöde med ankomst, pågående arbeten och klara bilar." },
    { property: "og:title", content: "Verkstadsskärm – Däckhotell" },
    { property: "og:description", content: "Verkstadens dagens bokningar med tider, lagerplatser och arbetsstatus." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <RequireRole roles={["superadmin", "useradmin", "mekaniker"]}><WorkshopBoard /></RequireRole>,
});