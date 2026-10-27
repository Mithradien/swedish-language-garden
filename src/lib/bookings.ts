import Papa from "papaparse";

export type Service = "Skifte" | "Skifte och förvaring" | "Nyförvaring" | "Avsluta förvaring" | "Okänd";
export const SERVICES: Service[] = ["Skifte", "Skifte och förvaring", "Nyförvaring", "Avsluta förvaring", "Okänd"];

export interface Booking {
  name: string;
  regnr: string;
  date: string; // ISO yyyy-mm-dd
  dateLabel: string;
  start: string;
  end: string;
  service: Service;
  phone: string;
}

export type ScheduleRow = Omit<Booking, "service"> & { service: Service | "" };

/** Schemat kompletterar endast dagar i importen; bokningar utanför schemat behålls. */
export function withEmptySlots(bookings: Booking[]): ScheduleRow[] {
  const minutes = (time: string) => {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
  };
  const timeLabel = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  const rows: ScheduleRow[] = [...bookings];
  const dates = [...new Set(bookings.map(b => b.date))];
  for (const date of dates) {
    const daily = bookings.filter(b => b.date === date);
    const occupied = new Set(daily.map(b => minutes(b.start)));
    for (const [first, last] of [[420, 495], [555, 675], [765, 930]] as const) {
      for (let start = first; start <= last; start += 15) {
        if (occupied.has(start)) continue;
        rows.push({ date, dateLabel: daily[0]?.dateLabel ?? date, start: timeLabel(start), end: timeLabel(start + 30), regnr: "", name: "", phone: "", service: "" });
      }
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || minutes(a.start) - minutes(b.start) || a.start.localeCompare(b.start));
}

const MONTHS: Record<string, number> = {
  januari: 1, februari: 2, mars: 3, april: 4, maj: 5, juni: 6, juli: 7,
  augusti: 8, september: 9, oktober: 10, november: 11, december: 12,
};

export function normalizeRegnr(s: string): string {
  return (s || "").toUpperCase().replace(/[^A-Z0-9ÅÄÖ]/g, "");
}

export function parseSwedishDate(s: string): string {
  const m = (s || "").trim().match(/^(\d{1,2})\s+([a-zåäö]+),?\s+(\d{4})$/i);
  if (!m) return s;
  const [, d = "", monName = "", y = ""] = m;
  const mon = MONTHS[monName.toLowerCase()];
  if (!mon) return s;
  return `${y}-${String(mon).padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function parseCustomFields(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const block of (text || "").replace(/\r/g, "").split(/\n\s*\n/)) {
    const [key, ...rest] = block.split("\n");
    if (key) out[key.trim()] = rest.join(" ").trim();
  }
  return out;
}

/**
 * "till" = däcken kunden vill skifta till, "från" = däcken kunden tar av.
 * Förvarade hos oss + förvara hos oss  -> Skifte och förvaring
 * Med sig        + förvara hos oss  -> Nyförvaring
 * Förvarade hos oss + förvara själv   -> Avsluta förvaring
 * Med sig        + förvara själv   -> Skifte
 */
export function classifyService(till: string, fran: string): Service {
  const t = (till || "").toLowerCase();
  const f = (fran || "").toLowerCase();
  const tillStored = t.includes("förvarade hos");
  const tillOwn = t.includes("med mig") || t.includes("har jag inte");
  const franStore = f.includes("förvara hos");
  const franSelf = f.includes("själv");
  if (tillStored && franStore) return "Skifte och förvaring";
  if (tillOwn && franStore) return "Nyförvaring";
  if (tillStored && franSelf) return "Avsluta förvaring";
  if (tillOwn && franSelf) return "Skifte";
  return "Okänd";
}

export function parseBookingsCsv(csv: string): Booking[] {
  const res = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return res.data.map((row) => {
    const f = parseCustomFields(row["Custom Field Data"] ?? "");
    const regKey = Object.keys(f).find((k) => /reg/i.test(k)) ?? "REG nr";
    const tillKey = Object.keys(f).find((k) => /skifta till/i.test(k)) ?? "";
    const franKey = Object.keys(f).find((k) => /skiftar från/i.test(k)) ?? "";
    return {
      name: `${row["First Name"] ?? ""} ${row["Last Name"] ?? ""}`.trim(),
      regnr: normalizeRegnr(f[regKey] ?? ""),
      date: parseSwedishDate(row["Date"] ?? ""),
      dateLabel: (row["Date"] ?? "").replace(",", ""),
      start: row["Start Time"] ?? "",
      end: row["End Time"] ?? "",
      service: classifyService(f[tillKey] ?? "", f[franKey] ?? ""),
      phone: f["Telefon"] ?? "",
    };
  });
}

/** Hitta kolumner för regnummer och lagerplats i Excel-raderna. */
export function guessColumns(headers: string[]) {
  const reg = headers.find((h) => /reg/i.test(h)) ?? headers[0] ?? "";
  const plats = headers.find((h) => /plats|lager|hylla|fack|position/i.test(h)) ?? headers[1] ?? "";
  return { reg, plats };
}

/** Unika regnummer, sorterade, utan tomma. */
export function uniqueRegnrs(list: ScheduleRow[]): string[] {
  return [...new Set(list.map((b) => b.regnr).filter(Boolean))].sort();
}

/** Text att kopiera: antingen bara regnummer, eller dag/tid/regnr/tjänst. */
export function listToText(list: ScheduleRow[], onlyRegnr: boolean): string {
  if (onlyRegnr) return uniqueRegnrs(list).join("\n");
  return list.map((b) => `${b.dateLabel} ${b.start}  ${b.regnr}  ${b.service}`).join("\n");
}

/** Excel-anpassad CSV (semikolumner + BOM). Lagerplats kolonn tillkommer om plats anges. */
export function listToCsv(list: ScheduleRow[], plats?: (regnr: string) => string): string {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Datum", "Tid", "Regnr", "Tjänst", "Kund", ...(plats ? ["Lagerplats"] : [])];
  const rows = list.map((b) => {
    const cells = [b.dateLabel, b.start, b.regnr, b.service, b.name];
    if (plats) cells.push(plats(b.regnr));
    return cells.map(esc).join(";");
  });
  return "\uFEFF" + [head.map(esc).join(";"), ...rows].join("\r\n");
}

