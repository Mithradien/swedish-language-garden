import { createFileRoute } from "@tanstack/react-router";
import { StaffArea } from "@/components/staff/role-gate";
export const Route = createFileRoute("/personal")({
  head: () => ({ meta: [
    { title: "Personal – Däckhotell" }, { name: "description", content: "Personalens vy med roller för superadmin och mekaniker." },
    { property: "og:title", content: "Personal – Däckhotell" }, { property: "og:description", content: "Personalvy för däckhotellets bokningar och användare." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: StaffArea,
});
