/** Rules for linking cars and bookings to a signed-in customer by e-mail or phone. */
export function normPhone(p: string | null | undefined): string {
  let d = String(p ?? "").replace(/\D/g, "");
  if (d.startsWith("0046")) d = d.slice(4);
  else if (d.startsWith("46") && d.length >= 11) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}
export const normEmail = (e: string | null | undefined) => String(e ?? "").trim().toLowerCase();

export interface Contact { email: string; phone: string }

/** True when the row's e-mail or phone (min 7 digits) is the customer's. */
export function matchesContact(me: Contact, row: { email?: string | null; phone?: string | null }): boolean {
  const e = normEmail(me.email);
  if (e && normEmail(row.email) === e) return true;
  const p = normPhone(me.phone);
  return p.length >= 7 && normPhone(row.phone) === p;
}

/** Regnummer från bokningen som ska kopplas till kontot efter inloggning. */
export const PENDING_REGNR_KEY = "pending-regnr";

/** Koppling av regnummer: okänd bil eller matchande kontakt kopplas direkt, annars väntar den på personalen. */
export function claimStatus(me: Contact, car: { email?: string | null; phone?: string | null } | null): "kopplad" | "vantar" {
  return !car || matchesContact(me, car) ? "kopplad" : "vantar";
}
