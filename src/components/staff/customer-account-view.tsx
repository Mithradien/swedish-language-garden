import { useEffect, useState } from "react";
import { CarFront, Gauge, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRow } from "@/lib/account-directory";
import { fetchCarStorage } from "@/lib/car-storage-sync";
import { fetchAllBookings } from "@/lib/booking-sync";
import { fetchDbStatuses } from "@/lib/status-sync";
import { normalizeRegnr, type Booking, type CarCard } from "@/lib/bookings";
import type { ArrivalStatus } from "@/lib/arrival";
import { TreadReading } from "@/components/customer/tread-reading";
import { CarDetailDialog } from "./car-detail-dialog";

export function CustomerAccountView({ customer, onClose }: { customer: AccountRow; onClose: () => void }) {
  const [data, setData] = useState<{ cards: Map<string, CarCard>; bookings: Booking[]; statuses: Record<string, ArrivalStatus> } | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([fetchCarStorage(), fetchAllBookings(), fetchDbStatuses()]).then(([cards, bookings, statuses]) => {
      if (!cards || !bookings || !statuses) throw new Error("Kunde inte läsa kundens biluppgifter.");
      if (active) setData({ cards, bookings, statuses });
    }).catch(() => { if (active) setError("Kunde inte hämta biluppgifterna. Stäng kundvyn och försök igen."); });
    return () => { active = false; };
  }, [customer.id]);
  const registrations = [...new Set(customer.registrations.map(normalizeRegnr))].filter(Boolean);
  return <>
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto p-5 sm:p-8">
        <DialogHeader className="border-b pb-5 pr-6 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="text-3xl">Mina sidor</DialogTitle>
            <span title="Redigering av denna kund kommer senare">
              <Button variant="outline" disabled aria-label="Redigera kunden – kommer senare">
                <Pencil className="h-4 w-4" />Redigera
              </Button>
            </span>
          </div>
          <DialogDescription className="break-words text-base">{customer.display_name || customer.email} · Kundvy</DialogDescription>
        </DialogHeader>
        <section className="space-y-4 border-b pb-6">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><UserRound className="h-5 w-5" />Kunduppgifter</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">{[["Namn", customer.display_name], ["E-post", customer.email], ["Telefon", customer.phone], ["Adress", [customer.street, customer.postal_code, customer.city].filter(Boolean).join(", ")]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || "Ej angivet"}</dd></div>)}</dl>
        </section>
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><CarFront className="h-5 w-5" />Mina bilar <span className="text-base text-muted-foreground">{registrations.length}</span></h2>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !data ? <p role="status" className="text-muted-foreground">Hämtar biluppgifter…</p> : registrations.length === 0 ? <p className="text-sm text-muted-foreground">Inga bilar är kopplade till kundkontot.</p> : <div className="grid gap-4 sm:grid-cols-2">{registrations.map(regnr => {
            const card = data.cards.get(regnr);
            return <article key={regnr} className="min-w-0 space-y-4 rounded-md border bg-card p-5">
              <div className="flex items-center gap-3"><CarFront className="h-8 w-8 shrink-0 text-muted-foreground" /><div className="min-w-0"><h3 className="break-words font-display text-2xl font-bold">{regnr}</h3><p className="break-words text-sm text-muted-foreground">{card?.modell || "Modell ej angiven"}</p></div></div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 border-y py-3"><div><p className="text-xs text-muted-foreground">Lagerplats</p><p className="font-medium">{card?.lagerplats || "Ej angiven"}</p></div><div><p className="text-xs text-muted-foreground">Lägsta mönsterdjup</p><TreadReading depth={card?.minDepth} tire={card?.tires[0]?.typ ?? ""} /></div></div>
              <Button variant="outline" onClick={() => setSelected(regnr)}><Gauge className="h-4 w-4" />Bil- och däckuppgifter</Button>
            </article>;
          })}</div>}
        </section>
      </DialogContent>
    </Dialog>
    {selected && data && <CarDetailDialog regnr={selected} card={data.cards.get(selected)} storage={data.cards.get(selected)?.lagerplats} bookings={data.bookings} statuses={data.statuses} onClose={() => setSelected(null)} />}
  </>;
}