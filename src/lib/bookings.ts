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
  const mon = MONTHS[m[2].toLowerCase()];
  if (!mon) return s;
  return `${m[3]}-${String(mon).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
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
