import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortal } from "@/components/customer/customer-portal";
export const Route=createFileRoute("/kund-exempel")({
  head:()=>({meta:[{title:"Mina sidor – Kundens exempelvy – Däckhotell"},{name:"description",content:"Kundens exempelvy med bilar, bokningar och skifteshistorik utan riktiga kunduppgifter."},{property:"og:title",content:"Kundens exempelvy – Däckhotell"},{property:"og:description",content:"Mina sidor med tydligt märkta exempeluppgifter."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"},{name:"robots",content:"noindex"}]}),
  component:()=> <CustomerPortal exampleOnly />,
});