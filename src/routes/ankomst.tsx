import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CarFront, Check, Clock3, Delete, Maximize, Minimize, RotateCcw } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kioskLookup, kioskRegister } from "@/lib/kiosk.functions";
import { findArrivalBookings, localDate, readBookings, readStatuses, registerArrival } from "@/lib/arrival";
import { normalizeRegnr, type Booking } from "@/lib/bookings";

export const Route = createFileRoute("/ankomst")({
  head: () => ({ meta: [
    { title: "Registrera ankomst – Däckhotell" },
    { name: "description", content: "Registrera din ankomst till däckverkstaden med bilens registreringsnummer." },
    { property: "og:title", content: "Registrera ankomst – Däckhotell" },
    { property: "og:description", content: "Ankomstregistrering för dagens bokade däckservice." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ArrivalPage,
});

const KEYS = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

function ArrivalPage() {
  const [regnr, setRegnr] = useState("");
  const [stage, setStage] = useState<"entry" | "confirm" | "done">("entry");
  const [matches, setMatches] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [already, setAlready] = useState(false);
  const [kiosk, setKiosk] = useState(false);
  const [today, setToday] = useState("");
  const [company, setCompany] = useState("Däckhotell");
  const busy = useRef(false);
  const remote = useRef(new WeakMap<Booking, string>());
  const input = useRef<HTMLInputElement>(null);

  function reset() {
    setRegnr(""); setStage("entry"); setMatches([]); setSelected(null); setError(""); setAlready(false);
    input.current?.focus();
  }
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => { const n = new Date(); setToday(localDate(n)); setTime(n.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })); };
    tick();
    const clock = window.setInterval(tick, 1000);
    try { const settings = JSON.parse(localStorage.getItem("bokningar.settings.v1") || "{}"); if (settings.company) setCompany(settings.company); } catch { /* use default */ }
    return () => window.clearInterval(clock);
  }, []);
  useEffect(() => {
    if (!regnr && stage === "entry") return;
    const timeout = window.setTimeout(reset, stage === "done" ? 12000 : 60000);
    return () => window.clearTimeout(timeout);
  }, [regnr, stage, selected]);

  async function lookup(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      let found: Booking[] = [];
      try {
        const rows = await kioskLookup({ data: { regnr } });
        found = rows.map(r => { const b = { name: "", regnr: r.regnr, date: r.date, dateLabel: r.date, start: r.start, end: r.end, service: r.service as Booking["service"], phone: "" }; remote.current.set(b, r.key); return b; });
      } catch { /* fall back to this device's file */ }
      if (!found.length) found = findArrivalBookings(readBookings(localStorage), regnr, localDate(), readStatuses(localStorage));
      if (!found.length) { setError("Vi hittar ingen bokning för bilen idag. Kontrollera regnumret eller kontakta personalen."); return; }
      setMatches(found); setSelected(found.length === 1 ? found[0] ?? null : null); setStage("confirm");
    } catch { setError("Dagens bokningar kunde inte läsas. Kontakta personalen så hjälper vi dig."); }
  }
  async function confirm() {
    if (!selected || busy.current) return;
    busy.current = true; setError("");
    try {
      const key = remote.current.get(selected);
      if (key) {
        const r = await kioskRegister({ data: { key } });
        setAlready(r.result === "already");
      } else {
        setAlready(registerArrival(localStorage, selected) === "already");
      }
      window.dispatchEvent(new Event("arrival-status-changed"));
      setStage("done");
    } catch (err) {
      setError(err instanceof Error && err.message.includes("Kontakta") ? err.message : "Ankomsten kunde inte sparas. Kontakta personalen.");
    } finally { busy.current = false; }
  }
  async function toggleKiosk() {
    if (kiosk) { setKiosk(false); if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); }
    else { setKiosk(true); await document.documentElement.requestFullscreen?.().catch(() => {}); }
  }

  return <main className="min-h-screen bg-background">
    <header className="bg-primary text-primary-foreground">
      {!kiosk && <TopNav />}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><CarFront className="h-8 w-8 shrink-0 text-signal" /><span className="break-words font-display text-2xl font-bold uppercase">{company}</span></div>
        <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" title={kiosk ? "Lämna helskärm" : "Öppna helskärm"} aria-label={kiosk ? "Lämna helskärm" : "Öppna helskärm"} onClick={toggleKiosk}>{kiosk ? <Minimize /> : <Maximize />}</Button>
      </div>
      <div className="h-1.5 bg-signal" />
    </header>
    <section className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-8 sm:py-10">
      <p className="mb-3 font-display text-lg uppercase text-muted-foreground">{today ? <>{new Date(`${today}T12:00:00`).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })} · <span className="font-bold text-foreground tabular-nums">{time}</span></> : "Välkommen"}</p>
      {stage === "entry" ? <>
        <h1 className="text-4xl font-bold uppercase sm:text-5xl">Välkommen</h1>
        <form onSubmit={lookup} className="mt-7">
          <label htmlFor="arrival-regnr" className="mb-3 block text-xl font-medium">Ditt registreringsnummer</label>
          <Input ref={input} id="arrival-regnr" value={regnr} onChange={e => { setRegnr(normalizeRegnr(e.target.value).slice(0, 10)); setError(""); }} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={10} className="mx-auto h-28 max-w-xl border-4 border-primary bg-card text-center font-display !text-6xl font-bold uppercase tracking-widest sm:h-32 sm:!text-7xl" />
          <div className="mt-6 space-y-2" aria-label="Tangentbord för registreringsnummer">
            {KEYS.map(row => <div key={row} className="flex justify-center gap-1 sm:gap-2">{[...row].map(key => <Button key={key} type="button" variant="outline" className="h-12 min-w-0 flex-1 px-0 font-display text-xl font-semibold sm:h-14 sm:text-2xl" onClick={() => { setRegnr(value => (value + key).slice(0, 10)); setError(""); }}>{key}</Button>)}</div>)}
            <div className="flex justify-center gap-2"><Button type="button" variant="ghost" className="h-12 px-6" onClick={() => setRegnr("")}><RotateCcw />Rensa</Button><Button type="button" variant="outline" className="h-12 px-6" title="Ta bort sista tecknet" aria-label="Ta bort sista tecknet" onClick={() => setRegnr(value => value.slice(0, -1))}><Delete /></Button></div>
          </div>
          <Button type="submit" disabled={regnr.length < 2} className="mt-6 h-16 w-full bg-signal font-display text-2xl font-bold uppercase text-signal-foreground hover:bg-signal/90">Hitta min bokning<ArrowRight /></Button>
        </form>
      </> : stage === "confirm" ? <>
        <h1 className="text-4xl font-bold uppercase sm:text-5xl">Din bokning idag</h1>
        <p className="mt-7 font-display text-5xl font-bold uppercase">{regnr}</p>
        <div className="my-8 space-y-3">
          {matches.length > 1 ? <div className="grid gap-3">{matches.map(b => <Button key={`${b.start}|${b.regnr}`} variant={selected === b ? "default" : "outline"} className="h-auto min-h-16 whitespace-normal py-4 text-lg" onClick={() => setSelected(b)}><Clock3 />{b.start.slice(0, 5)} · {b.service}</Button>)}</div> : selected && <><p className="flex items-center justify-center gap-3 font-display text-4xl font-semibold"><Clock3 className="h-7 w-7" />{selected.start.slice(0, 5)}</p><p className="mt-3 text-2xl">{selected.service}</p></>}
        </div>
        <Button disabled={!selected} className="h-16 w-full bg-signal font-display text-2xl font-bold uppercase text-signal-foreground hover:bg-signal/90" onClick={confirm}><Check />Jag är här</Button>
        <Button variant="ghost" className="mt-4 h-14 text-lg" onClick={reset}><ArrowLeft />Tillbaka</Button>
      </> : <div role="status" className="py-8">
        <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-st-arrived"><Check className="h-12 w-12" /></div>
        <h1 className="text-4xl font-bold uppercase sm:text-5xl">{already ? "Du är redan registrerad" : "Din ankomst är registrerad"}</h1>
        <p className="mt-6 font-display text-4xl font-bold">{regnr}</p>
        <p className="mt-4 text-xl">Tack! Personalen ser att du är här.</p>
        <Button variant="outline" className="mt-10 h-14 px-8 text-lg" onClick={reset}>Klart<ArrowRight /></Button>
      </div>}
      {error && stage === "entry" && regnr.length >= 2 && error.startsWith("Vi hittar") && <a href={`/boka?regnr=${encodeURIComponent(regnr)}`} className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-md bg-primary font-display text-2xl font-bold uppercase text-primary-foreground">Boka tid nu<ArrowRight /></a>}
      {error && <p role="alert" className="mt-5 border-l-4 border-destructive bg-destructive/10 px-4 py-4 text-left text-lg">{error}</p>}
    </section>
  </main>;
}