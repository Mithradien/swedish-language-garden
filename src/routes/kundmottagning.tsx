import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/staff/require-role";
import { WorkshopBoard } from "@/components/staff/workshop-board";

export const Route = createFileRoute("/kundmottagning")({
  head: () => ({ meta: [
    { title: "Kundmottagning – Däckhotell" },
    { name: "description", content: "Kundmottagningens skärm med bokad tid, registreringsnummer och besöksstatus." },
    { property: "og:title", content: "Kundmottagning – Däckhotell" },
    { property: "og:description", content: "Dagens bilar från ankomst till klar för avhämtning, utan interna verkstadsuppgifter." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <RequireRole roles={["superadmin", "useradmin", "mekaniker"]}><WorkshopBoard audience="reception" /></RequireRole>,
});