import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { CalendarDays, CarFront, Check, Clock3, Gauge, LogOut, Plus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { PENDING_REGNR_KEY } from "@/lib/customer-match";
import { cancelMyBooking, claimMyCar, myCustomerPage, rebookMyBooking, updateMyProfile } from "@/lib/customer.functions";
import { publicTakenTimes } from "@/lib/public-booking.functions";
import { dayLabel, longDayLabel, openDays, slotsForDate, stockholmNow } from "@/lib/booking-flow";
import { tireSeason, treadColor } from "@/lib/tread";
import { TREAD_STYLES, TreadGuide, TreadReading } from "./tread-reading";

type Page = Awaited<ReturnType<typeof myCustomerPage>>;
type Car = Page["cars"][number];
type Bk = Page["bookings"][number];
const STATUS: Record<string, string> = { vantas: "Bokad", ankommen: "Registrerad in", utebliven: "Uteblev", avbokad: "Avbokad" };
const POS: Record<string, string> = { VF: "Vänster fram", HF: "Höger fram", VB: "Vänster bak", HB: "Höger bak" };
const today = () => new Date().toLocaleDateString("sv-SE");

export function CustomerAccount() {
  const fetchPage = useServerFn(myCustomerPage);
  const cancel = useServerFn(cancelMyBooking);
  const rebook = useServerFn(rebookMyBooking);
  const saveProfile = useServerFn(updateMyProfile);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [details, setDetails] = useState<Car | null>(null);
  const [moving, setMoving] = useState<Bk | null>(null);
  const reload = () => fetchPage().then(setPage).catch(() => setError("Kunde inte hämta dina uppgifter."));
  const claim = useServerFn(claimMyCar);
  useEffect(() => {
    // Regnummer som kunden skrev in vid bokningen innan kontot skapades följer med hit.
    const pendingRegnr = localStorage.getItem(PENDING_REGNR_KEY);
    if (!pendingRegnr) { reload(); return; }
    localStorage.removeItem(PENDING_REGNR_KEY);
    claim({ data: { regnr: pendingRegnr } })
      .then(r => { if (r.ok) setMsg(r.status === "kopplad" ? `${r.regnr} är tillagd under Mina bilar.` : `${r.regnr} väntar på att verkstaden godkänner kopplingen.`); })
      .catch(() => {})
      .finally(reload);
  }, []);

  if (error) return <p className="mx-auto max-w-6xl px-5 py-10">{error}</p>;
  if (!page) return <p className="mx-auto max-w-6xl px-5 py-10 text-muted-foreground">Hämtar dina uppgifter…</p>;
  const upcoming = page.bookings.filter(b => b.date >= today() && b.status === "vantas").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const history = page.bookings.filter(b => !upcoming.includes(b));

  async function doCancel(b: Bk) {
    if (!confirm(`Avboka ${b.regnr} ${longDayLabel(b.date)} kl. ${b.time}?`)) return;
    const r = await cancel({ data: { key: b.key } });
    setMsg(r.ok ? "Bokningen är avbokad." : r.error); if (r.ok) reload();
  }
  async function signOut() { await supabase.auth.signOut(); }

  return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-5"><div><p className="mb-2 text-sm text-muted-foreground">{page.profile.name || page.profile.email}</p><h1 className="text-4xl font-bold sm:text-5xl">Mina sidor</h1></div>
      <div className="flex gap-2"><Button asChild className="h-11"><Link to="/boka"><Plus/>Boka tid</Link></Button><Button variant="outline" size="icon" className="h-11 w-11" aria-label="Logga ut" title="Logga ut" onClick={signOut}><LogOut/></Button></div></div>
    {msg && <p role="status" className="mb-6 rounded-md border bg-secondary px-4 py-3 text-sm">{msg}</p>}
    <Tabs defaultValue="overview"><TabsList className="h-auto w-full justify-start overflow-x-auto bg-transparent p-0">
      <TabsTrigger value="overview" className="px-4 py-3"><CalendarDays className="mr-2 h-4 w-4"/>Översikt</TabsTrigger>
      <TabsTrigger value="vehicles" className="px-4 py-3"><CarFront className="mr-2 h-4 w-4"/>Mina bilar</TabsTrigger>
      <TabsTrigger value="bookings" className="px-4 py-3"><Clock3 className="mr-2 h-4 w-4"/>Mina bokningar</TabsTrigger>
      <TabsTrigger value="profile" className="px-4 py-3"><UserRound className="mr-2 h-4 w-4"/>Mitt konto</TabsTrigger></TabsList>
      <TabsContent value="overview" className="mt-8 space-y-10">
        <section><h2 className="mb-4 text-2xl font-semibold">Nästa bokning</h2>{upcoming[0] ? <BookingCard b={upcoming[0]} onMove={() => setMoving(upcoming[0]!)} onCancel={() => doCancel(upcoming[0]!)}/> : <Empty text="Ingen kommande bokning"/>}</section>
        <section><h2 className="mb-4 text-2xl font-semibold">Mina bilar <span className="text-lg text-muted-foreground">{page.cars.length}</span></h2><Cars cars={page.cars} pending={page.pending} onDetails={setDetails}/></section>
      </TabsContent>
      <TabsContent value="vehicles" className="mt-8"><Cars cars={page.cars} pending={page.pending} onDetails={setDetails}/></TabsContent>
      <TabsContent value="bookings" className="mt-8 space-y-4"><h2 className="text-2xl font-semibold">Kommande</h2>{upcoming.length ? upcoming.map(b => <BookingCard key={b.key} b={b} onMove={() => setMoving(b)} onCancel={() => doCancel(b)}/>) : <Empty text="Ingen kommande bokning"/>}
        <h2 className="pt-6 text-2xl font-semibold">Historik</h2>{history.length ? <ul className="divide-y rounded-md border bg-card">{history.map(b => <li key={b.key} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span><b>{b.regnr}</b> · {dayLabel(b.date)} kl. {b.time} · {b.service}</span><span className="text-muted-foreground">{b.status === "vantas" ? "Genomförd" : STATUS[b.status] ?? b.status}</span></li>)}</ul> : <Empty text="Ingen tidigare historik"/>}</TabsContent>
      <TabsContent value="profile" className="mt-8 max-w-xl"><Profile page={page} onSave={async d => { const r = await saveProfile({ data: d }); setMsg(r.ok ? "Uppgifterna är sparade." : "Kunde inte spara."); reload(); }}/></TabsContent>
    </Tabs>
    <Dialog open={!!details} onOpenChange={o => { if (!o) setDetails(null); }}><DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle className="text-3xl">{details?.regnr} · Däckuppgifter</DialogTitle><DialogDescription>{details?.modell}{details?.lagerplats ? ` · Lagerplats ${details.lagerplats}` : ""}</DialogDescription></DialogHeader>
      {details && (details.tires.length ? <><div className="grid grid-cols-2 gap-3">{details.tires.map((t, i) => { const tire = `${t.typ} ${t.dimension}`; const c = treadColor(t.depth, tireSeason(tire)); return <div key={i} className={`rounded-md border border-l-4 p-4 ${TREAD_STYLES[c]}`}><p className="text-sm text-foreground">{POS[t.position] ?? t.position}</p><p className="text-xs text-muted-foreground">{t.marke} {t.dimension}</p><TreadReading depth={t.depth} tire={tire}/></div>; })}</div><TreadGuide tire={`${details.tires[0]?.typ ?? ""}`}/></> : <p className="text-muted-foreground">Inga däckuppgifter registrerade än.</p>)}
    </DialogContent></Dialog>
    {moving && <MoveDialog b={moving} onClose={() => setMoving(null)} onDone={async (date, time) => { const r = await rebook({ data: { key: moving.key, date, time } }); if (r.ok) { setMoving(null); setMsg("Bokningen har fått en ny tid."); reload(); } return r.ok ? "" : r.error; }}/>}
  </div>;
}

function Empty({ text }: { text: string }) { return <div className="flex min-h-28 items-center justify-center rounded-md border border-dashed text-muted-foreground">{text}</div>; }

function Cars({ cars, pending, onDetails }: { cars: Car[]; pending: string[]; onDetails: (c: Car) => void }) {
  if (!cars.length && pending.length) return <div className="grid gap-5 md:grid-cols-2">{pending.map(r => <PendingCar key={r} regnr={r}/>)}</div>;
  if (!cars.length) return <Empty text="Inga bilar hittades med din e-post eller ditt telefonnummer"/>;
  return <div className="grid gap-5 md:grid-cols-2">{cars.map(c => <article key={c.regnr} className="rounded-md border bg-card p-5"><div className="flex items-center justify-between"><span className="rounded-sm border-2 border-primary px-3 py-1 font-display text-xl font-bold">{c.regnr}</span>{c.lagerplats && <span className="text-sm text-muted-foreground">Däck hos oss</span>}</div><h3 className="mt-4 text-2xl font-semibold">{c.modell || "Bil"}</h3><div className="my-4 border-y py-3"><p className="text-xs text-muted-foreground">Lägsta mönsterdjup</p><TreadReading depth={c.minDepth} tire={c.tires[0]?.typ ?? ""}/></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onDetails(c)}><Gauge/>Däckuppgifter</Button><Button variant="ghost" asChild><Link to="/boka">Boka tid</Link></Button></div></article>)}{pending.map(r => <PendingCar key={r} regnr={r}/>)}</div>;
}

function BookingCard({ b, onMove, onCancel }: { b: Bk; onMove: () => void; onCancel: () => void }) {
  return <article className="flex flex-wrap items-center justify-between gap-4 rounded-md border-l-4 border-l-signal bg-card p-5"><div><p className="text-sm font-medium text-svc-forvaring">Bokad</p><h3 className="text-2xl font-semibold capitalize">{longDayLabel(b.date)} <span className="whitespace-nowrap">kl. {b.time}</span></h3><p className="mt-1 text-sm text-muted-foreground"><b className="text-foreground">{b.regnr}</b> · {b.service}</p></div><div className="flex gap-2"><Button variant="outline" onClick={onMove}><Clock3/>Boka om</Button><Button variant="ghost" onClick={onCancel}><X/>Avboka</Button></div></article>;
}

function MoveDialog({ b, onClose, onDone }: { b: Bk; onClose: () => void; onDone: (date: string, time: string) => Promise<string> }) {
  const now = useMemo(() => stockholmNow(), []);
  const days = useMemo(() => openDays(now, 10), [now]);
  const [day, setDay] = useState(days[0] ?? "");
  const [taken, setTaken] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setTime(""); if (day) publicTakenTimes({ data: { date: day } }).then(r => setTaken(r.taken)); }, [day]);
  const slots = slotsForDate(day, now, taken).filter(s => s.state === "ledig");
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setErr(await onDone(day, time)); setBusy(false); }
  return <Dialog open onOpenChange={o => { if (!o) onClose(); }}><DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle className="text-3xl">Boka om {b.regnr}</DialogTitle><DialogDescription>Nuvarande tid: {longDayLabel(b.date)} kl. {b.time}</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-5"><div className="flex gap-2 overflow-x-auto pb-1">{days.map(d => <Button type="button" key={d} variant={d === day ? "default" : "outline"} onClick={() => setDay(d)} className="shrink-0 capitalize">{dayLabel(d)}</Button>)}</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map(s => <Button type="button" key={s.time} variant={time === s.time ? "default" : "outline"} aria-pressed={time === s.time} onClick={() => setTime(s.time)}>{s.time}</Button>)}</div>
      {!slots.length && <p className="text-sm text-muted-foreground">Inga lediga tider den dagen.</p>}
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      <Button type="submit" className="h-11 w-full" disabled={!time || busy}><Check/>Bekräfta ny tid</Button></form></DialogContent></Dialog>;
}

function Profile({ page, onSave }: { page: Page; onSave: (d: { name: string; phone: string; street: string; postalCode: string; city: string }) => void }) {
  const p = page.profile;
  const [f, setF] = useState({ name: p.name, phone: p.phone, street: p.street, postalCode: p.postalCode, city: p.city });
  const field = (k: keyof typeof f, label: string, type = "text") => <label className="block space-y-2 text-sm font-medium"><span>{label}</span><Input className="h-11 bg-card" type={type} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })}/></label>;
  return <form className="space-y-5" onSubmit={e => { e.preventDefault(); onSave(f); }}><h2 className="text-3xl font-semibold">Mitt konto</h2><p className="text-sm text-muted-foreground">E-post: <b className="text-foreground">{p.email}</b>. Bilar och bokningar med samma e-post eller telefonnummer visas automatiskt.</p>
    {field("name", "Namn")}{field("phone", "Telefon", "tel")}<h3 className="pt-4 text-xl font-semibold">Adress <span className="text-sm font-normal text-muted-foreground">(valfritt)</span></h3>{field("street", "Gatuadress")}<div className="grid gap-5 sm:grid-cols-[1fr_2fr]">{field("postalCode", "Postnummer")}{field("city", "Ort")}</div>
    <Button type="submit" className="h-11"><Check/>Spara</Button></form>;
}

function PendingCar({ regnr }: { regnr: string }) {
  return <article className="rounded-md border border-dashed bg-card p-5"><span className="rounded-sm border-2 border-primary px-3 py-1 font-display text-xl font-bold">{regnr}</span><p className="mt-4 text-sm text-muted-foreground">Väntar på att verkstaden godkänner kopplingen. Däckuppgifterna visas när den är godkänd.</p></article>;
}
