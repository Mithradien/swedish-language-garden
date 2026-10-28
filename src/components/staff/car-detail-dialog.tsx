import { useEffect, useState } from "react";
import { CarFront, CalendarDays, Gauge, History, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TREAD_STYLES, TreadGuide, TreadReading } from "@/components/customer/tread-reading";
import { tireSeason, treadColor } from "@/lib/tread";
import { carBookings, fetchCarHistory, type CarEvent, type CarWorkOrder } from "@/lib/admin-car";
import { statusKey, type ArrivalStatus } from "@/lib/arrival";
import type { Booking, CarCard } from "@/lib/bookings";

const STATUS_LABELS: Record<string, string> = { vantas: "Väntas", ankommen: "Ankommen", ej: "Ej ankommen", avbokad: "Avbokad under dagen" };
const ORDER_LABELS: Record<string, string> = { ej_paborjad: "Ej påbörjad", paborjad: "Påbörjad", klar: "Klar" };
const POSITIONS: Record<string, string> = { VF: "Fram vänster", HF: "Fram höger", VB: "Bak vänster", HB: "Bak höger" };
function stamp(value: string) { return new Date(value).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" }); }

export function CarDetailDialog({ regnr, card, storage, bookings, statuses, onClose }: {
  regnr: string; card: CarCard | undefined; storage: string | undefined; bookings: Booking[];
  statuses: Record<string, ArrivalStatus>; onClose: () => void;
}) {
  const own = carBookings(regnr, bookings);
  const latest = own[0];
  const [history, setHistory] = useState<{ events: CarEvent[]; orders: CarWorkOrder[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setHistory(null); setError("");
    fetchCarHistory(regnr).then(result => { if (active) setHistory(result); })
      .catch(() => { if (active) setError("Historik och däckprotokoll kunde inte hämtas. Stäng bilvyn och försök igen."); });
    return () => { active = false; };
  }, [regnr]);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto p-5 sm:p-8">
      <DialogHeader className="border-b pb-5 pr-6 text-left">
        <div className="flex items-center gap-4"><CarFront className="h-10 w-10 shrink-0 text-muted-foreground"/><div className="min-w-0"><DialogTitle className="break-words font-display text-4xl font-bold">{regnr}</DialogTitle><DialogDescription className="mt-2 text-base">{card?.modell || "Modell ej angiven"} · Lagerplats {storage || card?.lagerplats || "ej angiven"}</DialogDescription></div></div>
      </DialogHeader>
      <section className="min-w-0 space-y-4 border-b pb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><UserRound className="h-5 w-5"/>Kunduppgifter</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {[ ["Namn", card?.owner || latest?.name], ["Kundnummer", card?.kundnr], ["Telefon", card?.phone || latest?.phone], ["E-post", card?.email] ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || "Ej angivet"}</dd></div>)}
        </dl>
      </section>
      <section className="space-y-4 border-b pb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Gauge className="h-5 w-5"/>Däckuppgifter</h2>
        {card?.tires.length ? <div className="grid gap-3 sm:grid-cols-2">{card.tires.map((t, i) => <article key={`${t.position}-${i}`} className={`min-w-0 rounded-md border border-l-4 p-4 ${TREAD_STYLES[treadColor(t.depth, tireSeason(t.typ))]}`}>
          <h3 className="font-semibold text-foreground">{POSITIONS[t.position] || t.position}</h3>
          <p className="mt-1 break-words text-sm text-foreground">{t.typ || "Däcktyp ej angiven"} · {t.dimension || "Dimension ej angiven"}</p>
          <p className="break-words text-sm text-muted-foreground">{t.marke || "Märke ej angivet"}</p>
          <TreadReading depth={t.depth} tire={t.typ}/>
          {t.inland && <p className="mt-2 text-xs text-foreground">Inlämnad {t.inland}</p>}
        </article>)}</div> : null}{card?.tires.length ? <TreadGuide tire={card.tires[0]!.typ}/> : <p className="text-sm text-muted-foreground">Inga detaljerade däckuppgifter finns för bilen.{card?.minDepth != null && ` Minsta mönsterdjup: ${card.minDepth.toLocaleString("sv-SE")} mm.`}</p>}
      </section>
      <section className="space-y-4 border-b pb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><CalendarDays className="h-5 w-5"/>Bokningar <span className="text-base text-muted-foreground">{own.length}</span></h2>
        {own.length ? own.map((b, i) => <article key={`${statusKey(b)}-${i}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border-l-4 border-l-signal bg-card p-4">
          <div className="min-w-0"><h3 className="font-semibold">{b.dateLabel || b.date} · {b.start}</h3><p className="mt-1 text-sm text-muted-foreground">{b.service}</p></div><span className="text-sm font-medium">{STATUS_LABELS[statuses[statusKey(b)] ?? "vantas"]}</span>
        </article>) : <p className="text-sm text-muted-foreground">Inga bokningar finns för bilen i den inlästa listan.</p>}
      </section>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !history ? <p role="status" className="text-sm text-muted-foreground">Hämtar historik och däckprotokoll…</p> : <>
        <section className="space-y-4 border-b pb-6"><h2 className="text-2xl font-semibold">Däckprotokoll</h2>
          {history.orders.length ? history.orders.map(order => <article key={order.id} className="space-y-3 rounded-md border p-4">
            <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{order.booking_date} · {order.service || "Tjänst ej angiven"}</h3><span className="text-sm">{ORDER_LABELS[order.status] || order.status}</span></div>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[["Fram vänster", order.depth_vf], ["Fram höger", order.depth_hf], ["Bak vänster", order.depth_vb], ["Bak höger", order.depth_hb]].map(([label, depth]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{depth == null ? "Ej uppmätt" : `${depth.toLocaleString("sv-SE")} mm`}</dd></div>)}</dl>
            {order.note && <p className="whitespace-pre-wrap break-words text-sm">{order.note}</p>}
            <p className="text-xs text-muted-foreground">{order.started_at && `Påbörjad ${stamp(order.started_at)} · `}{order.finished_at && `Klar ${stamp(order.finished_at)} · `}Uppdaterad {stamp(order.updated_at)}</p>
          </article>) : <p className="text-sm text-muted-foreground">Inga däckprotokoll finns registrerade.</p>}
        </section>
        <section className="space-y-4"><h2 className="flex items-center gap-2 text-2xl font-semibold"><History className="h-5 w-5"/>Besökshistorik</h2>
          {history.events.length ? <ol className="divide-y">{history.events.map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><p className="font-medium">{STATUS_LABELS[event.status] || event.status}</p><p className="text-muted-foreground">{event.source === "personal" ? "Personal" : event.source === "kiosk" ? "Ankomstregistrering" : event.source} · Bokning {event.booking_key.split("|").slice(0, 2).join(" ")}</p></div><time dateTime={event.created_at}>{stamp(event.created_at)}</time></li>)}</ol> : <p className="text-sm text-muted-foreground">Inga statusändringar finns registrerade.</p>}
        </section>
      </>}
    </DialogContent>
  </Dialog>;
}