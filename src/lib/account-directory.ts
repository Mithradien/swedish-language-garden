import type { AppRole } from "@/hooks/use-auth";

export const ACCOUNT_GROUPS = [
  { id: "admins", label: "Admins" },
  { id: "mekaniker", label: "Mekaniker" },
  { id: "kunder", label: "Kunder" },
  { id: "ovrigt", label: "Övrigt" },
] as const;
export type AccountGroup = typeof ACCOUNT_GROUPS[number]["id"];
export type AccountRow = {
  id: string; email: string | null; display_name: string | null;
  phone: string | null; street: string | null; postal_code: string | null; city: string | null;
  roles: AppRole[]; registrations: string[]; models: string[];
};

export function accountGroup(roles: AppRole[]): AccountGroup {
  if (roles.includes("superadmin") || roles.includes("useradmin")) return "admins";
  if (roles.includes("mekaniker")) return "mekaniker";
  if (roles.includes("kund")) return "kunder";
  return "ovrigt";
}

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const compact = (s: string) => normalize(s).replace(/[^a-z0-9]/g, "");

export function accountMatches(row: AccountRow, search: string): boolean {
  const fields = [row.display_name, row.email, row.phone, row.street, row.postal_code, row.city, ...row.registrations, ...row.models].filter((v): v is string => Boolean(v));
  const full = normalize(fields.join(" "));
  const packed = fields.map(compact);
  const q = compact(search);
  if (!q) return true;
  if (packed.some(f => f.includes(q))) return true;
  return normalize(search).trim().split(/\s+/).every(term => full.includes(term) || packed.some(f => f.includes(compact(term))));
}