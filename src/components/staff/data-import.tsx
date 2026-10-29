import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncBookingsToDb } from "@/lib/booking-sync";
import { syncCarStorage } from "@/lib/car-storage-sync";
import { ARRIVAL_HISTORY_KEY, CSV_KEY, STATUS_KEY } from "@/lib/arrival";
import { buildCarCards, guessColumns, parseBookingsCsv } from "@/lib/bookings";

const XLS_KEY = "bokningar.xls.v1";

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { toast.error("Filen är för stor för att sparas i webbläsaren."); return false; }
}

/** Import of the bookings CSV and the Excel car storage list; the overview reads what is saved here. */
export function DataImport() {
  const [csvInfo, setCsvInfo] = useState("");
  const [xlsInfo, setXlsInfo] = useState("");

  function readInfo() {
    try {
      const c = localStorage.getItem(CSV_KEY);
      if (c) { const s = JSON.parse(c) as { name: string; text: string }; setCsvInfo(`${s.name} · ${parseBookingsCsv(s.text).length} bokningar`); } else setCsvInfo("");
      const x = localStorage.getItem(XLS_KEY);
      if (x) { const s = JSON.parse(x) as { name: string; rows: unknown[] }; setXlsInfo(`${s.name} · ${s.rows.length} rader`); } else setXlsInfo("");
    } catch { /* trasig sparad data ignoreras */ }
  }
  useEffect(readInfo, []);

  async function onCsv(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseBookingsCsv(text);
    save(CSV_KEY, { name: f.name, text });
    e.target.value = "";
    readInfo();
    const n = await syncBookingsToDb(parsed);
    if (n !== null) toast.success(`${n} bokningar sparade i databasen`);
    else toast.info("Bokningarna sparas i databasen bara när en superadmin är inloggad.");
  }

  async function onXls(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await f.arrayBuffer());
    const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
    if (!sheet) return;
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const g = guessColumns(data[0] ? Object.keys(data[0]) : []);
    save(XLS_KEY, { name: f.name, rows: data, reg: g.reg, plats: g.plats });
    e.target.value = "";
    readInfo();
    const n = await syncCarStorage(buildCarCards(data));
    if (n !== null) toast.success(`${n} bilar uppdaterade i databasen`);
    else toast.info("Billagret sparas i databasen bara när en superadmin är inloggad.");
  }

  function clearSaved() {
    for (const k of [CSV_KEY, XLS_KEY, STATUS_KEY, ARRIVAL_HISTORY_KEY]) localStorage.removeItem(k);
    readInfo();
    toast.success("Sparade filer i webbläsaren är rensade.");
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <label className="group flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed bg-card p-5 transition hover:border-primary">
        <FileText className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-semibold uppercase">Bokningar (CSV)</div>
          <div className="truncate text-sm text-muted-foreground">{csvInfo || "Välj exportfilen från bokningssystemet"}</div>
        </div>
        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onCsv} />
      </label>
      <label className="group flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed bg-card p-5 transition hover:border-primary">
        <FileSpreadsheet className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-semibold uppercase">Billager (Excel)</div>
          <div className="truncate text-sm text-muted-foreground">{xlsInfo || "Välj Excel-filen med lagerplatser"}</div>
        </div>
        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={onXls} />
      </label>
      {(csvInfo || xlsInfo) && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground md:col-span-2">
          <span>Filerna sparas även i den här webbläsaren tills du laddar in nya.</span>
          <Button variant="outline" size="sm" onClick={clearSaved}>Rensa sparad data</Button>
        </div>
      )}
    </section>
  );
}
