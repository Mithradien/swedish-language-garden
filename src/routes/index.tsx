import { toast } from "sonner";
import { fetchAllBookings, syncBookingsToDb } from "@/lib/booking-sync";
import { fetchDbStatuses, saveDbStatus } from "@/lib/status-sync";
import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/top-nav";
import { UserAdmin } from "@/components/staff/user-admin";
import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ARRIVAL_HISTORY_KEY, STATUS_KEY, readStatuses, resetArrival, statusKey, type ArrivalStatus } from "@/lib/arrival";

const CSV_KEY = "bokningar.csv.v1";
const XLS_KEY = "bokningar.xls.v1";
const SETTINGS_KEY = "bokningar.settings.v1";

type Settings = { logo: string; company: string; phone: string; email: string; address: string; signal: string };
const DEFAULT_SETTINGS: Settings = { logo: "", company: "", phone: "", email: "", address: "", signal: "#f9cc21" };
const PRESETS = [
  { name: "Gult", hex: "#f9cc21" },
  { name: "Orange", hex: "#e4572e" },
  { name: "Blå", hex: "#2e86ab" },
  { name: "Grön", hex: "#3f8f5f" },
];

/** Mörk eller ljus text beroende på den valda färgen. */
function readableOn(hex: string) {
  const m = /^#?([\da-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "#1a1a1a";
  const n = parseInt(m[1] ?? "", 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.45 ? "#1a1a1a" : "#f7f6f2";
}


const STATUS: Record<ArrivalStatus, { label: string; cls: string }> = {
  vantas: { label: "Väntas", cls: "bg-card" },
  ankommen: { label: "Ankommen", cls: "bg-st-arrived status-mark" },
  ej: { label: "Ej ankommen", cls: "bg-st-noshow status-mark" },
  avbokad: { label: "Avbokad under dagen", cls: "bg-st-cancelled status-mark" },
};
import { FileSpreadsheet, FileText, Printer, Search, Tag, Upload } from "lucide-react";
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
  type Booking, type CarCard, type ScheduleRow, type Service, type Tire,
} from "@/lib/bookings";


export const Route = createFileRoute("/")({
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
  component: Index,
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

const depthTone = (d: number | null) =>
  d == null ? "text-muted-foreground" : d < 3 ? "text-st-noshow" : d < 4 ? "text-st-cancelled" : "text-st-arrived";

function TireCard({ card }: { card: CarCard }) {
  const groups = new Map<string, Tire[]>();
  for (const t of card.tires) {
    const k = t.typ || "Däck";
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  return (
    <div className="space-y-4 rounded-md border bg-card p-5">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="font-display text-3xl font-bold uppercase tracking-widest">{card.regnr}</span>
        {card.modell && <span className="font-display text-lg uppercase text-muted-foreground">{card.modell}</span>}
        {card.lagerplats && (
          <span className="font-display text-lg uppercase">Lagerplats <span className="text-signal">{card.lagerplats}</span></span>
        )}
        {card.minDepth != null && (
          <span className={`font-display text-lg uppercase ${depthTone(card.minDepth)}`}>
            Minsta mönsterdjup {card.minDepth.toFixed(1)} mm
          </span>
        )}
      </div>
      {(card.owner || card.kundnr || card.phone || card.email) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {card.owner && <span>{card.owner}</span>}
          {card.kundnr && <span>Kundnr {card.kundnr}</span>}
          {card.phone && <span>{card.phone}</span>}
          {card.email && <span>{card.email}</span>}
        </div>
      )}
      {groups.size ? (
        [...groups.entries()].map(([typ, tires]) => (
          <div key={typ} className="space-y-2">
            <div className="font-display text-sm uppercase tracking-widest text-muted-foreground">{typ}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tires.map((t, i) => (
                <div key={i} className="rounded-md border bg-background p-3">
                  <div className="font-display text-xl font-bold">{t.position}</div>
                  <div className="text-sm tabular-nums">{t.dimension || "—"}</div>
                  <div className="truncate text-sm text-muted-foreground">{t.marke || "—"}</div>
                  <div className={`font-display text-2xl font-bold tabular-nums ${depthTone(t.depth)}`}>
                    {t.depth == null ? "—" : `${t.depth.toFixed(1)} mm`}
                  </div>
                  {t.inland && <div className="text-xs text-muted-foreground">Inlämnad {t.inland}</div>}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          Den här filen har inga hjuluppgifter – bara lagerplats{card.minDepth == null ? "" : " och minsta mönsterdjup"}.
        </p>
      )}
    </div>
  );
}

function Index() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const settingsFirst = useRef(true);
  useEffect(() => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(s) as Partial<Settings>) });
    } catch { /* trasig sparad data ignoreras */ }
  }, []);
  useEffect(() => {
    if (settingsFirst.current) { settingsFirst.current = false; return; }
    save(SETTINGS_KEY, settings);
  }, [settings]);
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--signal", settings.signal);
    root.style.setProperty("--accent", settings.signal);
    root.style.setProperty("--signal-foreground", readableOn(settings.signal));
  }, [settings.signal]);

  async function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(f);
    });
    setSettings((s) => ({ ...s, logo: dataUrl }));
    e.target.value = "";
  }



  const [bookings, setBookings] = useState<Booking[]>([]);
  const [csvName, setCsvName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [xlsName, setXlsName] = useState("");
  const [regCol, setRegCol] = useState("");
  const [platsCol, setPlatsCol] = useState("");
  const [day, setDay] = useState("alla");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchAllBookings().then(db => { if (db && db.length) { setBookings(db); setCsvName("Databasen"); } });
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

  function clearSaved() {
    localStorage.removeItem(CSV_KEY); localStorage.removeItem(XLS_KEY); localStorage.removeItem(STATUS_KEY);
    localStorage.removeItem(ARRIVAL_HISTORY_KEY);
    setBookings([]); setCsvName(""); setRows([]); setHeaders([]); setRegCol(""); setPlatsCol(""); setXlsName(""); setDay("alla"); setStatuses({});
  }

  const [statuses, setStatuses] = useState<Record<string, ArrivalStatus>>({});
  useEffect(() => {
    const refresh = () => {
      let local: Record<string, ArrivalStatus> = {};
      try { local = readStatuses(localStorage); } catch { /* ignoreras */ }
      setStatuses(local);
      fetchDbStatuses().then(db => { if (db) setStatuses({ ...local, ...db }); });
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("arrival-status-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("arrival-status-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const statusOf = (b: ScheduleRow): ArrivalStatus => statuses[statusKey(b)] ?? "vantas";
  function setStatus(b: ScheduleRow, s: ArrivalStatus) {
    void saveDbStatus(statusKey(b), b.regnr, s);
    if (s === "vantas") {
      try { setStatuses(resetArrival(localStorage, statusKey(b))); }
      catch { setStatuses((prev) => { const next = { ...prev }; delete next[statusKey(b)]; return next; }); }
      window.dispatchEvent(new Event("arrival-status-changed"));
      return;
    }
    setStatuses((prev) => {
      let next = { ...prev };
      try { next = readStatuses(localStorage); } catch { /* use displayed statuses */ }
      next[statusKey(b)] = s;
      save(STATUS_KEY, next);
      return next;
    });
  }

  async function onCsv(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseBookingsCsv(text);
    setBookings(parsed);
    setCsvName(f.name);
    setDay("alla");
    save(CSV_KEY, { name: f.name, text });
    e.target.value = "";
    const n = await syncBookingsToDb(parsed);
    if (n !== null) toast.success(`${n} bokningar sparade i databasen`);
    else toast.info("Bokningarna visas här, men sparas i databasen bara när en superadmin är inloggad.");
  }

  async function onXls(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await f.arrayBuffer());
    const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
    if (!sheet) return;
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const h = data[0] ? Object.keys(data[0]) : [];
    const g = guessColumns(h);
    setRows(data); setHeaders(h); setRegCol(g.reg); setPlatsCol(g.plats); setXlsName(f.name);
    e.target.value = "";
  }

  const platsMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) {
      const k = normalizeRegnr(String(r[regCol] ?? ""));
      if (k) m.set(k, String(r[platsCol] ?? ""));
    }
    return m;
  }, [rows, regCol, platsCol]);

  const cards = useMemo(() => buildCarCards(rows), [rows]);



  const days = useMemo(
    () => [...new Set(bookings.map((b) => b.date))].sort(),
    [bookings],
  );
  const labelFor = (d: string) => bookings.find((b) => b.date === d)?.dateLabel ?? d;

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [bookings],
  );
  const scheduleRows = useMemo(() => withEmptySlots(bookings), [bookings]);
  const dayList = day === "alla" ? scheduleRows : scheduleRows.filter((b) => b.date === day);
  const dayBooked = dayList.filter(b => b.service !== "").length;
  const q = normalizeRegnr(query);
  const hits = q ? sorted.filter((b) => b.regnr.includes(q)) : [];
  const card = q ? cards.get(q) : undefined;


  const stats = useMemo(() => {
    const c = Object.fromEntries(SERVICES.map((s) => [s, 0])) as Record<Service, number>;
    for (const b of bookings) c[b.service]++;
    return c;
  }, [bookings]);
  const max = Math.max(1, ...Object.values(stats));
  const missingPlats = bookings.filter(
    (b) => rows.length && (b.service === "Skifte och förvaring" || b.service === "Avsluta förvaring") && !platsMap.get(b.regnr),
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
              <td className="px-4 py-2.5">{b.service && (
                <span className="inline-flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" title="Ändra status"
                        style={{ width: "7.5rem", minWidth: "7.5rem" }}
                        className={`inline-flex shrink-0 justify-center rounded-sm border-2 border-primary px-2 py-0.5 font-display font-bold tracking-widest whitespace-nowrap ${STATUS[statusOf(b)].cls}`}>
                        {b.regnr || "?"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1">
                      {(Object.keys(STATUS) as ArrivalStatus[]).map((s) => (
                        <button key={s} type="button" onClick={() => setStatus(b, s)}
                          className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted ${statusOf(b) === s ? "font-semibold" : ""}`}>
                          <span className={`h-3 w-3 rounded-full border border-primary ${STATUS[s].cls}`} />{STATUS[s].label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
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
        <section className="screen-only grid gap-4 md:grid-cols-2">
          <label className="group flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed bg-card p-5 transition hover:border-primary">
            <FileText className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-semibold uppercase">1. Bokningar (CSV)</div>
              <div className="truncate text-sm text-muted-foreground">{csvName ? `${csvName} · ${bookings.length} bokningar` : "Välj exportfilen från bokningssystemet"}</div>
            </div>
            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onCsv} />
          </label>
          <label className="group flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed bg-card p-5 transition hover:border-primary">
            <FileSpreadsheet className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-semibold uppercase">2. Billager (Excel)</div>
              <div className="truncate text-sm text-muted-foreground">{xlsName ? `${xlsName} · ${cards.size} bilar` : "Valfritt – välj Excel-filen med lagerplatser"}</div>
            </div>
            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={onXls} />
          </label>
          {(csvName || xlsName) && (
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground md:col-span-2">
              <span>Filerna sparas i den här webbläsaren tills du laddar in nya.</span>
              <Button variant="outline" size="sm" onClick={clearSaved}>Rensa sparad data</Button>
            </div>
          )}
        </section>

        {headers.length > 0 && (
          <section className="screen-only flex flex-wrap items-center gap-4 rounded-md bg-secondary p-4 text-sm">
            <span className="font-medium">Kolumner i Excel:</span>
            <span>Regnummer</span>
            <Select value={regCol} onValueChange={setRegCol}>
              <SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
            <span>Lagerplats</span>
            <Select value={platsCol} onValueChange={setPlatsCol}>
              <SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </section>
        )}

        <Tabs defaultValue="bokade">
          <TabsList className="screen-only h-auto">
            <TabsTrigger value="bokade" className="px-5 py-2 font-display text-base uppercase">Bokade bilar</TabsTrigger>
            <TabsTrigger value="sok" className="px-5 py-2 font-display text-base uppercase">Sök regnr</TabsTrigger>
            <TabsTrigger value="statistik" className="px-5 py-2 font-display text-base uppercase">Statistik</TabsTrigger>
            <TabsTrigger value="installningar" className="px-5 py-2 font-display text-base uppercase">Inställningar</TabsTrigger>

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
                placeholder="T.ex. ABC123"
                className="h-12 bg-card pl-10 font-display text-xl uppercase tracking-widest"
              />
            </div>
            {q && (
              <>
                {card ? (
                  <TireCard card={card} />
                ) : platsMap.has(q) ? (
                  <p className="text-sm">Lagerplats för <b>{q}</b>: <Plats r={q} /></p>
                ) : null}
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
                <div className="font-display text-4xl font-bold">{rows.length ? missingPlats : "–"}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="installningar" className="screen-only mt-6 space-y-4">
            <UserAdmin />
            <div className="grid gap-4 md:grid-cols-2">
              <section className="space-y-3 rounded-md border bg-card p-5">
                <h2 className="font-display text-xl font-semibold uppercase">Logotyp</h2>
                {settings.logo ? (
                  <div className="space-y-3">
                    <img src={settings.logo} alt="Er logotyp" className="h-24 w-auto max-w-full rounded-md border bg-background p-2 object-contain" />
                    <Button variant="outline" size="sm" onClick={() => setSettings((s) => ({ ...s, logo: "" }))}>Ta bort logotyp</Button>
                  </div>
                ) : (
                  <label className="group flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed bg-background p-4 transition hover:border-primary">
                    <div className="min-w-0 flex-1 font-display uppercase">Välj bild</div>
                    <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                    <input type="file" accept="image/*" className="sr-only" onChange={onLogo} />
                  </label>
                )}
                <p className="text-sm text-muted-foreground">Logotypen visas överst på sidan och sparas i den här webbläsaren.</p>
              </section>

              <section className="space-y-3 rounded-md border bg-card p-5">
                <h2 className="font-display text-xl font-semibold uppercase">Färger</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.hex} type="button" title={p.name}
                      onClick={() => setSettings((s) => ({ ...s, signal: p.hex }))}
                      className={`h-10 w-10 rounded-md border-2 ${settings.signal.toLowerCase() === p.hex ? "border-foreground" : "border-border"}`}
                      style={{ background: p.hex }} />
                  ))}
                  <label className="flex items-center gap-2 text-sm">
                    Egen
                    <input type="color" value={settings.signal}
                      onChange={(e) => setSettings((s) => ({ ...s, signal: e.target.value }))}
                      className="h-10 w-14 cursor-pointer rounded-md border bg-background" />
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">Färgen används för markeringar, rast-rader och lagerplats.</p>
              </section>
            </div>

            <section className="space-y-4 rounded-md border bg-card p-5">
              <h2 className="font-display text-xl font-semibold uppercase">Företagsuppgifter</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">Namn
                  <Input value={settings.company} onChange={(e) => setSettings((s) => ({ ...s, company: e.target.value }))} placeholder="Din verkstad" />
                </label>
                <label className="space-y-1 text-sm">Telefon
                  <Input value={settings.phone} onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))} placeholder="031-000 00" />
                </label>
                <label className="space-y-1 text-sm">E-post
                  <Input value={settings.email} onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))} placeholder="hej@verkstad.se" />
                </label>
                <label className="space-y-1 text-sm">Adress
                  <Input value={settings.address} onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))} placeholder="Gatan 1, Ort" />
                </label>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSettings(DEFAULT_SETTINGS)}>Återställ inställningar</Button>
            </section>
          </TabsContent>
        </Tabs>

      </div>
    </main>
  );
}
