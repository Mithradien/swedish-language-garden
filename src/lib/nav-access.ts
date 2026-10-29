export type NavRole = "superadmin" | "useradmin" | "mekaniker" | "kund";
export type NavPath = "/oversikt" | "/boka" | "/kund" | "/personal" | "/verkstad" | "/kundmottagning" | "/ankomst" | "/installningar";

const ALL: { to: NavPath; label: string; roles: NavRole[] | "all"; group?: "screens" }[] = [
  { to: "/oversikt", label: "Bokningsöversikt", roles: ["superadmin", "useradmin", "mekaniker"] },
  { to: "/boka", label: "Boka tid", roles: "all" },
  { to: "/kund", label: "Mina sidor", roles: ["superadmin", "kund"] },
  { to: "/personal", label: "Personal", roles: ["superadmin", "useradmin", "mekaniker"] },
  { to: "/verkstad", label: "Verkstad", roles: ["superadmin", "useradmin", "mekaniker"], group: "screens" },
  { to: "/kundmottagning", label: "Kundmottagning", roles: ["superadmin", "useradmin", "mekaniker"], group: "screens" },
  { to: "/ankomst", label: "Ankomst", roles: ["superadmin", "useradmin", "mekaniker"] },
  { to: "/installningar", label: "Inställningar", roles: ["superadmin", "useradmin"] },
];

// Which menu items a user with these roles sees; signed-out visitors pass [].
export function navItemsFor(roles: NavRole[]) {
  return ALL.filter((i) => i.roles === "all" || i.roles.some((r) => roles.includes(r)));
}
