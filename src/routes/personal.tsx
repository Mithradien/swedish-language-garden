import { createFileRoute } from "@tanstack/react-router";
import { StaffPreview } from "@/components/customer/staff-preview";
export const Route = createFileRoute("/personal")({
  head: () => ({ meta: [
    { title: "Personal – Däckhotell" }, { name: "description", content: "Förhandsvisning av personalens bilkopplingar och bokningsschema inför egen server-drift." },
    { property: "og:title", content: "Personal – Däckhotell" }, { property: "og:description", content: "Personalvy för däckhotellets bokningar och bilkopplingar." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: StaffPreview,
});
