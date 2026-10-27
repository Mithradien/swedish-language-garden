import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ChangeEvent } from "react";
import { ClipboardCheck, Copy, Download, FileSpreadsheet, FileText, Printer, Search, Tag, Upload } from "lucide-react";
import { printLabel } from "@/lib/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  SERVICES, guessColumns, listToCsv, listToText, normalizeRegnr, parseBookingsCsv, uniqueRegnrs, withEmptySlots,
  type Booking, type Service, type ScheduleRow,
} from "@/lib/bookings";
import { deliverFile } from "@/lib/download";

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

function Index() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [csvName, setCsvName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [xlsName, setXlsName] = useState("");
  const [regCol, setRegCol] = useState("");
  const [platsCol, setPlatsCol] = useState("");
  const [day, setDay] = useState("alla");
  const [query, setQuery] = useState("");
  const [lday, setLday] = useState("alla");
  const [lservice, setLservice] = useState("alla");
  const [onlyRegnr, setOnlyRegnr] = useState(false);
  const [copied, setCopied] = useState(false);

  async function onCsv(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBookings(parseBookingsCsv(await f.text()));
    setCsvName(f.name);
    setDay("alla");
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
  }

  const platsMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) {
      const k = normalizeRegnr(String(r[regCol] ?? ""));
      if (k) m.set(k, String(r[platsCol] ?? ""));
    }
    return m;
  }, [rows, regCol, platsCol]);

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

  const stats = useMemo(() => {
    const c = Object.fromEntries(SERVICES.map((s) => [s, 0])) as Record<Service, number>;
    for (const b of bookings) c[b.service]++;
    return c;
  }, [bookings]);
  const max = Math.max(1, ...Object.values(stats));
  const missingPlats = bookings.filter(
    (b) => rows.length && (b.service === "Skifte och förvaring" || b.service === "Avsluta förvaring") && !platsMap.get(b.regnr),
  ).length;

  const listFiltered = useMemo(() => {
    let l = scheduleRows;
    if (lday !== "alla") l = l.filter((b) => b.date === lday);
    if (lservice !== "alla") l = l.filter((b) => b.service === lservice);
    return l;
  }, [scheduleRows, lday, lservice]);

  const listText = useMemo(() => listToText(listFiltered, onlyRegnr), [listFiltered, onlyRegnr]);
  const listCount = onlyRegnr ? uniqueRegnrs(listFiltered).length : listFiltered.filter(b => b.service !== "").length;
  const listEmpty = onlyRegnr ? 0 : listFiltered.filter(b => b.service === "").length;

  async function copyList() {
    if (!listText) return;
    try {
      await navigator.clipboard.writeText(listText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard nekad – listan syns ändå på skärmen
    }
  }

  function downloadList() {
    if (!listFiltered.length) return;
    if (onlyRegnr) {
      deliverFile(new Blob([`${listText}\n`], { type: "text/plain;charset=utf-8" }), "regnummer.txt");
      return;
    }
    const csv = listToCsv(listFiltered, rows.length ? (r) => platsMap.get(r) ?? "" : undefined);
    deliverFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), "bokade-bilar.csv");
  }

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
          {list.map((b, i) => (
            <tr key={i} className="border-t">
              {showDate && <td className="px-4 py-2.5 whitespace-nowrap">{b.dateLabel}</td>}
              <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{b.start}–{b.end}</td>
              <td className="px-4 py-2.5">{b.service && (
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-sm border-2 border-primary px-2 py-0.5 font-display font-bold tracking-widest">{b.regnr || "?"}</span>
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
          ))}
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
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-signal">Däckhotell</p>
          <h1 className="text-5xl font-bold uppercase">Bokningsöversikt</h1>
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
              <div className="truncate text-sm text-muted-foreground">{xlsName ? `${xlsName} · ${rows.length} bilar` : "Valfritt – välj Excel-filen med lagerplatser"}</div>
            </div>
            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={onXls} />
          </label>
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
            <TabsTrigger value="listor" className="px-5 py-2 font-display text-base uppercase">Listor</TabsTrigger>
            <TabsTrigger value="sok" className="px-5 py-2 font-display text-base uppercase">Sök regnr</TabsTrigger>
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
              <Button onClick={() => window.print()} disabled={!dayList.length} variant="outline" className="font-display uppercase">
                <Printer className="mr-2 h-4 w-4" />Skriv ut
              </Button>
            </div>
            <Table list={dayList} showDate={day === "alla"} />
          </TabsContent>

          <TabsContent value="listor" className="print-list mt-6 space-y-4">
            <div className="print-only print-heading">
              <h2>Bokade bilar – {lday === "alla" ? "Alla dagar" : labelFor(lday)}</h2>
              <p>{lservice === "alla" ? "Alla tjänster" : lservice} · {listCount} {onlyRegnr ? "bilar" : "bokningar"}{listEmpty > 0 && ` · ${listEmpty} obokade tider`}</p>
            </div>
            <div className="screen-only flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Dag</span>
              <Select value={lday} onValueChange={setLday}>
                <SelectTrigger className="w-56 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alla">Alla dagar</SelectItem>
                  {days.map((d) => <SelectItem key={d} value={d}>{labelFor(d)}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm font-medium">Tjänst</span>
              <Select value={lservice} onValueChange={setLservice}>
                <SelectTrigger className="w-56 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alla">Alla tjänster</SelectItem>
                  {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onlyRegnr}
                  onChange={(e) => setOnlyRegnr(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Bara regnummer, inga dubbletter
              </label>
            </div>

            <div className="screen-only flex flex-wrap items-center gap-3">
              <Button onClick={copyList} disabled={!listCount} variant="outline" className="font-display uppercase">
                {copied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Kopierad" : "Kopiera lista"}
              </Button>
              <Button onClick={downloadList} disabled={!listCount} className="font-display uppercase">
                <Download className="mr-2 h-4 w-4" />
                {onlyRegnr ? "Ladda ner txt" : "Ladda ner csv"}
              </Button>
              <Button onClick={() => window.print()} disabled={!listCount} variant="outline" className="font-display uppercase">
                <Printer className="mr-2 h-4 w-4" />Skriv ut
              </Button>
              <span className="text-sm text-muted-foreground">
                {listCount} {onlyRegnr ? "bilar" : "bokningar"}{listEmpty > 0 && ` · ${listEmpty} obokade tider`}
              </span>
            </div>

            {onlyRegnr ? (
              <div className="print-regnrs max-h-[60vh] overflow-auto rounded-md border bg-card p-5">
                {uniqueRegnrs(listFiltered).length ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-4">
                    {uniqueRegnrs(listFiltered).map((r) => (
                      <div key={r} className="font-display text-lg font-semibold tracking-widest">{r}</div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">Inga bokningar att visa</div>
                )}
              </div>
            ) : (
              <Table list={listFiltered} showDate />
            )}
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
                {platsMap.has(q) && (
                  <p className="text-sm">Lagerplats för <b>{q}</b>: <Plats r={q} /></p>
                )}
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
        </Tabs>
      </div>
    </main>
  );
}
