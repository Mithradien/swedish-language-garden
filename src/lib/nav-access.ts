export type NavRole = "superadmin" | "useradmin" | "mekaniker" | "kund";
export type NavPath = "/oversikt" | "/boka" | "/kund" | "/personal" | "/ankomst" | "/installningar";

const ALL: { to: NavPath; label: string; roles: NavRole[] | "all" }[] = [
  { to: "/oversikt", label: "Bokningsöversikt", roles: ["superadmin", "useradmin", "mekaniker"] },
  { to: "/boka", label: "Boka tid", roles: "all" },
  { to: "/kund", label: "Mina sidor", roles: ["superadmin", "kund"] },
  { to: "/personal", label: "Personal", roles: ["superadmin", "useradmin", "mekaniker"] },
  { to: "/ankomst", label: "Ankomst", roles: ["superadmin", "useradmin", "mekaniker"] },
  { to: "/installningar", label: "Inställningar", roles: ["superadmin", "useradmin"] },
];

// Which menu items a user with these roles sees; signed-out visitors pass [].
export function navItemsFor(roles: NavRole[]) {
  return ALL.filter((i) => i.roles === "all" || i.roles.some((r) => roles.includes(r)));
}
