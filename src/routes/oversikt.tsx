import { RequireRole } from "@/components/staff/require-role";
import { toast } from "sonner";
import { fetchAllBookings, syncBookingsToDb } from "@/lib/booking-sync";
import { fetchDbArrivalTimes, fetchDbStatuses, saveDbStatus } from "@/lib/status-sync";
import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ARRIVAL_HISTORY_KEY, STATUS_KEY, readStatuses, resetArrival, statusKey, type ArrivalStatus } from "@/lib/arrival";
import { useSettings } from "@/lib/settings";
import { useAuth } from "@/hooks/use-auth";
import { bookingMatches, searchCars } from "@/lib/admin-car";
import { CarDetailDialog } from "@/components/staff/car-detail-dialog";
import { MoveBookingDialog } from "@/components/staff/move-booking-dialog";

const CSV_KEY = "bokningar.csv.v1";
const XLS_KEY = "bokningar.xls.v1";


const STATUS: Record<ArrivalStatus, { label: string; cls: string }> = {
  vantas: { label: "Väntas", cls: "bg-card" },
  ankommen: { label: "Ankommen", cls: "bg-st-arrived status-mark" },
  sen: { label: "Sen ankomst", cls: "bg-st-late status-mark" },
  ej: { label: "Ej ankommen", cls: "bg-st-noshow status-mark" },
  avbokad: { label: "Avbokad under dagen", cls: "bg-st-cancelled status-mark" },
};
import { Printer, Search, Tag, ChevronDown, CarFront, ArrowRight, Lock, LockOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { printLabel } from "@/lib/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  SERVICES, buildCarCards, guessColumns, normalizeRegnr, parseBookingsCsv, withEmptySlots,
  type Booking, type CarCard, type ScheduleRow, type Service,
} from "@/lib/bookings";
import { fetchCarStorage, mergeCard, syncCarStorage } from "@/lib/car-storage-sync";


export const Route = createFileRoute("/oversikt")({
  head: () => ({
    meta: [
      { title: "Bokningsöversikt – bilar & lagerplatser" },
      { name: "description", content: "Läs in bokningar (CSV) och billager (Excel) för att se regnummer, tider, tjänster och lagerplatser." },
      { property: "og:title", content: "Bokningsöversikt – bilar & lagerplatser" },
      { property: "og:description", content: "Bokade bilar, lagerplatser, sökning och statistik från CSV och Excel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuardedIndex,
});

const SVC_CLASS: Record<Service, string> = {
  "Skifte": "bg-svc-skifte",
  "Skifte och förvaring": "bg-svc-forvaring",
  "Nyförvaring": "bg-svc-ny",
  "Avsluta förvaring": "bg-svc-avsluta",
  "Okänd": "bg-muted-foreground",
};

function ServiceTag({ s }: { s: Service }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${SVC_CLASS[s]}`} />
      {s}
    </span>
  );
}

function GuardedIndex() {
  return <RequireRole roles={["superadmin", "useradmin", "mekaniker"]}><Index /></RequireRole>;
}

function Index() {
  const { settings } = useSettings();
  const { hasRole } = useAuth();
  const isStaff = hasRole("superadmin") || hasRole("useradmin") || hasRole("mekaniker");
  const isAdmin = hasRole("superadmin");
  const canLock = isAdmin || hasRole("useradmin");
  const [locks, setLocks] = useState<Set<string>>(new Set());
  const lockKey = (date: string, time: string) => `${date}|${time.slice(0, 5)}`;
  useEffect(() => {
    if (!isStaff && !canLock) return;
    supabase.from("slot_locks").select("slot_date,slot_time").then(({ data }) => {
      if (data) setLocks(new Set(data.map(l => lockKey(l.slot_date, l.slot_time))));
    });
  }, [isStaff, canLock]);
  async function toggleLock(date: string, time: string) {
    const k = lockKey(date, time); const t = time.slice(0, 5);
    const locked = locks.has(k);
    const { error } = locked
      ? await supabase.from("slot_locks").delete().eq("slot_date", date).eq("slot_time", t)
      : await supabase.from("slot_locks").insert({ slot_date: date, slot_time: t });
    if (error) { toast.error("Kunde inte ändra låsningen."); return; }
    setLocks(prev => { const n = new Set(prev); if (locked) n.delete(k); else n.add(k); return n; });
    toast.success(locked ? `Tiden ${t} är öppnad för bokning.` : `Tiden ${t} är låst.`);
  }
  const [moving, setMoving] = useState<ScheduleRow | null>(null);
  const reloadBookings = () => fetchAllBookings().then(db => { if (db) setBookings(db); });
  const [selectedRegnr, setSelectedRegnr] = useState<string | null>(null);



  const [bookings, setBookings] = useState<Booking[]>([]);
  const [csvName, setCsvName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [xlsName, setXlsName] = useState("");
  const [regCol, setRegCol] = useState("");
  const [platsCol, setPlatsCol] = useState("");
  const [day, setDay] = useState("alla");
  const [query, setQuery] = useState("");

  const [dbCards, setDbCards] = useState<Map<string, CarCard>>(new Map());
  useEffect(() => {
    fetchAllBookings().then(db => { if (db && db.length) { setBookings(db); setCsvName("Databasen"); } });
    fetchCarStorage().then(db => { if (db) setDbCards(db); });
  }, []);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CSV_KEY);
      if (c) {
        const s = JSON.parse(c) as { name: string; text: string };
        setBookings(parseBookingsCsv(s.text)); setCsvName(s.name);
      }
      const x = localStorage.getItem(XLS_KEY);
      if (x) {
        const s = JSON.parse(x) as { name: string; rows: Record<string, unknown>[]; reg: string; plats: string };
        setRows(s.rows); setHeaders(s.rows[0] ? Object.keys(s.rows[0]) : []);
        setRegCol(s.reg); setPlatsCol(s.plats); setXlsName(s.name);
      }
    } catch {
      // trasig sparad data ignoreras
    }
  }, []);

  useEffect(() => {
    if (!xlsName) return;
    save(XLS_KEY, { name: xlsName, rows, reg: regCol, plats: platsCol });
  }, [xlsName, rows, regCol, platsCol]);

  function save(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { alert("Filen är för stor för att sparas i webbläsaren. Den visas ändå tills sidan stängs."); }
  }


  const [statuses, setStatuses] = useState<Record<string, ArrivalStatus>>({});
  const [arrivedAt, setArrivedAt] = useState<Record<string, string>>({});
  useEffect(() => {
    const refresh = () => {
      let local: Record<string, ArrivalStatus> = {};
      try { local = readStatuses(localStorage); } catch { /* ignoreras */ }
      setStatuses(local);
      fetchDbStatuses().then(db => { if (db) setStatuses({ ...local, ...db }); });
      const localTimes: Record<string, string> = {};
      try { const h = JSON.parse(localStorage.getItem("bokningar.arrivals.v1") || "[]"); if (Array.isArray(h)) for (const e of h) if (e?.bookingKey && e?.arrivedAt) localTimes[e.bookingKey] = e.arrivedAt; } catch { /* ignoreras */ }
      setArrivedAt(localTimes);
      fetchDbArrivalTimes().then(db => { if (db) setArrivedAt({ ...localTimes, ...db }); });
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("arrival-status-changed", refresh);
    window.addEventListener("focus", refresh);
    // Auto-refresh so kiosk/QR arrivals show up without reloading the page.
    const poll = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 10000);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("arrival-status-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const statusOf = (b: ScheduleRow): ArrivalStatus => statuses[statusKey(b)] ?? "vantas";
  function setStatus(b: ScheduleRow, s: ArrivalStatus) {
    const saved = saveDbStatus(statusKey(b), b.regnr, s);
    if (s === "vantas") {
      try { resetArrival(localStorage, statusKey(b)); } catch { /* ignoreras */ }
      setStatuses((prev) => { const next = { ...prev }; delete next[statusKey(b)]; return next; });
      void saved.then(() => window.dispatchEvent(new Event("arrival-status-changed")));
      return;
    }
    setStatuses((prev) => {
      // Bygg alltid vidare på det som visas (inkl. statusar från databasen),
      // så att andra bilars status aldrig skrivs över.
      let local: Record<string, ArrivalStatus> = {};
      try { local = readStatuses(localStorage); } catch { /* ignoreras */ }
      const next = { ...local, ...prev, [statusKey(b)]: s };
      save(STATUS_KEY, next);
      return next;
    });
  }


  const platsMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of dbCards.values()) if (c.lagerplats) m.set(c.regnr, c.lagerplats);
    for (const r of rows) {
      const k = normalizeRegnr(String(r[regCol] ?? ""));
      const p = String(r[platsCol] ?? "").trim();
      if (k && (p || !m.has(k))) m.set(k, p);
    }
    return m;
  }, [rows, regCol, platsCol, dbCards]);

  const cards = useMemo(() => {
    const m = new Map(dbCards);
    for (const c of buildCarCards(rows).values()) m.set(c.regnr, mergeCard(m.get(c.regnr), c));
    return m;
  }, [rows, dbCards]);



  const days = useMemo(
    () => [...new Set(bookings.map((b) => b.date))].sort(),
    [bookings],
  );
  // Open on today's date (or the next upcoming booking day) once bookings are loaded.
  const autoDay = useRef(false);
  useEffect(() => {
    if (autoDay.current || !days.length) return;
    autoDay.current = true;
    const n = new Date();
    const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    const pick = days.includes(today) ? today : days.find(d => d > today);
    if (pick) setDay(pick);
  }, [days]);
  const labelFor = (d: string) => bookings.find((b) => b.date === d)?.dateLabel ?? d;

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [bookings],
  );
  const scheduleRows = useMemo(() => withEmptySlots(bookings), [bookings]);
  const dayList = day === "alla" ? scheduleRows : scheduleRows.filter((b) => b.date === day);
  const dayBooked = dayList.filter(b => b.service !== "").length;
  const q = query.trim();
  const hits = q ? sorted.filter((b) => bookingMatches(query, b)) : [];
  const matchingCars = searchCars(query, bookings, cards, platsMap);


  const stats = useMemo(() => {
    const c = Object.fromEntries(SERVICES.map((s) => [s, 0])) as Record<Service, number>;
    for (const b of bookings) c[b.service]++;
    return c;
  }, [bookings]);
  const max = Math.max(1, ...Object.values(stats));
  const missingPlats = bookings.filter(
    (b) => (rows.length || dbCards.size) && (b.service === "Skifte och förvaring" || b.service === "Avsluta förvaring") && !platsMap.get(b.regnr),
  ).length;


  const Plats = ({ r }: { r: string }) => {
    const p = platsMap.get(r);
    return p ? <span className="font-display text-lg font-semibold">{p}</span> : <span className="text-muted-foreground">—</span>;
  };

  const Table = ({ list, showDate }: { list: ScheduleRow[]; showDate?: boolean }) => (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-left">
        <thead className="bg-primary text-primary-foreground font-display text-sm uppercase tracking-wider">
          <tr>
            {showDate && <th className="px-4 py-3">Datum</th>}
            <th className="px-4 py-3">Tid</th>
            <th className="px-4 py-3">Regnr</th>
            <th className="px-4 py-3">Tjänst</th>
            <th className="px-4 py-3">Lagerplats</th>
            <th className="px-4 py-3">Kund</th>
          </tr>
        </thead>
        <tbody>
          {list.map((b, i) => {
            const toMin = (t: string) => { const m = t.match(/^(\d{1,2}):(\d{2})/); return m ? Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) : -1; };
            const prev = list[i - 1];
            const between = (a: number, z: number) => prev && prev.date === b.date && toMin(prev.start) <= a && toMin(b.start) >= z;
            const breaks = [
              between(8 * 60 + 15, 9 * 60 + 15) && { label: "Frukostrast", time: "09:00–09:15" },
              between(11 * 60 + 15, 12 * 60 + 45) && { label: "Lunchrast", time: "12:00–12:45" },
            ].filter(Boolean) as { label: string; time: string }[];
            return (<Fragment key={i}>
            {breaks.map((br) => (
              <tr key={br.label} className="lunch-row border-t bg-muted">
                {showDate && <td className="px-4 py-2" />}
                <td className="px-4 py-2 whitespace-nowrap tabular-nums font-semibold text-muted-foreground">{br.time}</td>
                <td colSpan={4} className="px-4 py-2 text-center font-display font-semibold uppercase tracking-widest text-muted-foreground">{br.label}</td>
              </tr>
            ))}
            <tr className="border-t">
              {showDate && <td className="px-4 py-2.5 whitespace-nowrap">{b.dateLabel}</td>}
              <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{b.start}</td>
              <td className="px-4 py-2.5">{!b.service && (locks.has(lockKey(b.date, b.start)) || canLock) && (
                canLock ? <Button type="button" size="sm" variant={locks.has(lockKey(b.date, b.start)) ? "secondary" : "ghost"} className="h-8 gap-2 px-2"
                  title={locks.has(lockKey(b.date, b.start)) ? "Öppna tiden för bokning" : "Lås tiden"} onClick={() => toggleLock(b.date, b.start)}>
                  {locks.has(lockKey(b.date, b.start)) ? <><Lock className="h-4 w-4" />Låst</> : <><LockOpen className="h-4 w-4 opacity-50" /><span className="screen-only text-muted-foreground">Lås</span></>}
                </Button> : <span className="inline-flex items-center gap-2 text-sm"><Lock className="h-4 w-4" />Låst</span>
              )}{b.service && (
                <span className="inline-flex items-center gap-2">
                  {isStaff ? <Button type="button" variant="outline" title={`Visa bil ${b.regnr}`} onClick={() => setSelectedRegnr(normalizeRegnr(b.regnr))}
                    className={`h-8 w-30 min-w-30 shrink-0 justify-center rounded-sm border-2 border-primary px-2 font-display font-bold whitespace-nowrap ${STATUS[statusOf(b)].cls}`}>
                    {b.regnr || "?"}
                  </Button> : <span className={`inline-flex h-8 w-30 min-w-30 shrink-0 items-center justify-center rounded-sm border-2 border-primary px-2 font-display font-bold whitespace-nowrap ${STATUS[statusOf(b)].cls}`}>{b.regnr || "?"}</span>}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" title="Ändra status" aria-label={`Ändra status för ${b.regnr} ${b.start}`} className="screen-only h-7 w-7"><ChevronDown className="h-4 w-4"/></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1">
                      {(Object.keys(STATUS) as ArrivalStatus[]).map((s) => (
                        <Button key={s} type="button" variant="ghost" onClick={() => setStatus(b, s)}
                          className={`flex w-full justify-start gap-2 rounded-sm px-3 py-2 text-left text-sm ${statusOf(b) === s ? "font-semibold" : ""}`}>
                          <span className={`h-3 w-3 shrink-0 rounded-full border border-primary ${STATUS[s].cls}`} />{STATUS[s].label}
                        </Button>
                      ))}
                      {canLock && <div className="mt-1 border-t pt-1">
                        <Button type="button" variant="ghost" className="flex w-full justify-start rounded-sm px-3 py-2 text-sm" onClick={() => setMoving(b)}>Flytta bokning…</Button>
                        <Button type="button" variant="ghost" className="flex w-full justify-start rounded-sm px-3 py-2 text-sm text-destructive"
                          onClick={() => { if (window.confirm(`Avboka ${b.regnr} ${b.start}? Bokningen ligger kvar i historiken och tiden blir ledig.`)) setStatus(b, "avbokad"); }}>Avboka</Button>
                      </div>}
                    </PopoverContent>
                  </Popover>
                  {(statusOf(b) === "ankommen" || statusOf(b) === "sen") && arrivedAt[statusKey(b)] && <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">Ankom {new Date(arrivedAt[statusKey(b)]!).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</span>}
                  <Button size="sm" variant="ghost" className="screen-only h-7 px-2" title="Skriv ut etikett"
                    onClick={() => printLabel(b.regnr || "?", `${b.start} · ${b.dateLabel}`, b.service)}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </span>
              )}</td>
              <td className="px-4 py-2.5">{b.service && <ServiceTag s={b.service} />}</td>
              <td className="px-4 py-2.5">{b.service && <Plats r={b.regnr} />}</td>
              <td className="px-4 py-2.5 text-sm text-muted-foreground">{b.name}</td>
            </tr>
            </Fragment>);
          })}
          {!list.length && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Inga bokningar att visa</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="min-h-screen">
      <header className="screen-only bg-primary text-primary-foreground">
        <TopNav />
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-8">
          {settings.logo && (
            <img src={settings.logo} alt="" className="h-16 w-auto max-w-56 shrink-0 rounded-md bg-card p-2 object-contain" />
          )}
          <div className="min-w-0">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-signal">{settings.company || "Däckhotell"}</p>
            <h1 className="text-5xl font-bold uppercase">Bokningsöversikt</h1>
          </div>
        </div>
        <div className="h-2 bg-[repeating-linear-gradient(45deg,var(--signal)_0_16px,var(--primary)_16px_32px)]" />
      </header>


      <div className="booking-content mx-auto max-w-6xl space-y-8 px-6 py-8">
        {!bookings.length && <p className="screen-only rounded-md bg-secondary p-4 text-sm">Inga bokningar inlästa. Läs in filer under <a href="/installningar" className="font-semibold underline">Inställningar → Data &amp; import</a>.</p>}


        <Tabs defaultValue="bokade">
          <TabsList className="screen-only h-auto">
            <TabsTrigger value="bokade" className="px-5 py-2 font-display text-base uppercase">Bokade bilar</TabsTrigger>
            <TabsTrigger value="sok" className="px-5 py-2 font-display text-base uppercase">Sök</TabsTrigger>
            <TabsTrigger value="statistik" className="px-5 py-2 font-display text-base uppercase">Statistik</TabsTrigger>

          </TabsList>

          <TabsContent value="bokade" className="print-list mt-6 space-y-4">
            <div className="print-only print-heading">
              <h2>Bokade bilar – {day === "alla" ? "Alla dagar" : labelFor(day)}</h2>
              <p>{dayBooked} bokningar · {dayList.length - dayBooked} obokade tider</p>
            </div>
            <div className="screen-only flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Dag</span>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="w-56 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alla">Alla dagar</SelectItem>
                  {days.map((d) => <SelectItem key={d} value={d}>{labelFor(d)}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{dayBooked} bokningar · {dayList.length - dayBooked} obokade tider</span>
              <span className="flex flex-wrap gap-2 text-sm">
                {(Object.keys(STATUS) as ArrivalStatus[]).map((s) => (
                  <span key={s} className={`rounded-sm border px-2 py-0.5 ${STATUS[s].cls}`}>
                    {STATUS[s].label}: {dayList.filter((b) => b.service && statusOf(b) === s).length}
                  </span>
                ))}
              </span>
              <Button onClick={() => window.print()} disabled={!dayList.length} variant="outline" className="font-display uppercase">
                <Printer className="mr-2 h-4 w-4" />Skriv ut
              </Button>
            </div>
            <Table list={dayList} />
          </TabsContent>


          <TabsContent value="sok" className="mt-6 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Regnr, namn, kundnr, lagerplats, modell, telefon…"
                className="h-12 bg-card pl-10 text-lg"
              />
            </div>
            {q && (
              <>
                {isStaff && <div className="divide-y border-y">{matchingCars.map(regnr => {
                  const info = cards.get(regnr);
                  return <Button key={regnr} variant="ghost" onClick={() => setSelectedRegnr(regnr)} className="h-auto w-full justify-between gap-4 rounded-none px-3 py-4 text-left whitespace-normal" title={`Visa bil ${regnr}`}>
                    <span className="flex min-w-0 items-center gap-3"><CarFront className="h-5 w-5 shrink-0"/><span className="min-w-0"><span className="block font-display text-xl font-bold">{regnr}</span><span className="block break-words text-sm text-muted-foreground">{info?.modell || "Modell ej angiven"}{(platsMap.get(regnr) || info?.lagerplats) && ` · Lagerplats ${platsMap.get(regnr) || info?.lagerplats}`}</span></span></span><ArrowRight className="h-5 w-5 shrink-0"/>
                  </Button>;
                })}{!matchingCars.length && <p className="py-4 text-sm text-muted-foreground">Ingen bil hittades.</p>}</div>}
                <Table list={hits} showDate />
              </>
            )}

          </TabsContent>

          <TabsContent value="statistik" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.filter((s) => s !== "Okänd").map((s) => (
                <div key={s} className="rounded-md border bg-card p-5">
                  <ServiceTag s={s} />
                  <div className="mt-2 font-display text-5xl font-bold tabular-nums">{stats[s]}</div>
                  <div className="text-sm text-muted-foreground">
                    {bookings.length ? Math.round((stats[s] / bookings.length) * 100) : 0}% av alla
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-md border bg-card p-5">
              {SERVICES.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-44 text-sm">{s}</div>
                  <div className="h-4 flex-1 rounded-sm bg-muted">
                    <div className={`h-4 rounded-sm ${SVC_CLASS[s]}`} style={{ width: `${(stats[s] / max) * 100}%` }} />
                  </div>
                  <div className="w-10 text-right tabular-nums">{stats[s]}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-primary p-5 text-primary-foreground">
                <div className="text-sm opacity-80">Totalt antal bokningar</div>
                <div className="font-display text-4xl font-bold">{bookings.length}</div>
              </div>
              <div className="rounded-md bg-primary p-5 text-primary-foreground">
                <div className="text-sm opacity-80">Hämtas från förvaringen</div>
                <div className="font-display text-4xl font-bold">{stats["Skifte och förvaring"] + stats["Avsluta förvaring"]}</div>
              </div>
              <div className="rounded-md bg-primary p-5 text-primary-foreground">
                <div className="text-sm opacity-80">Från förvaring utan lagerplats</div>
                <div className="font-display text-4xl font-bold">{rows.length || dbCards.size ? missingPlats : "–"}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>
      {isStaff && selectedRegnr && <CarDetailDialog regnr={selectedRegnr} card={cards.get(selectedRegnr)} storage={platsMap.get(selectedRegnr)} bookings={bookings} statuses={statuses} onClose={() => setSelectedRegnr(null)}/> }
      {isAdmin && moving && <MoveBookingDialog booking={moving} onClose={() => setMoving(null)} onMoved={reloadBookings}/>}
    </main>
  );
}
