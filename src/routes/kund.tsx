import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortal } from "@/components/customer/customer-portal";
export const Route = createFileRoute("/kund")({
  head: () => ({ meta: [
    { title: "Mina sidor – Däckhotell" },
    { name: "description", content: "Kundportal för däckhotell med bilar, däckuppgifter och bokningar. Förhandsvisning inför egen server-drift." },
    { property: "og:title", content: "Mina sidor – Däckhotell" },
    { property: "og:description", content: "Däckhotellets kundportal för egna bilar och bokningar." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: CustomerPortal,
});
