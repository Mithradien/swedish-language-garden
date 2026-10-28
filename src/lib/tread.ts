export type TreadColor = "red" | "orange" | "yellow" | "green" | "unknown";
export type TireSeason = "summer" | "winter";
type Level = Exclude<TreadColor, "unknown">;

// Separate season thresholds so future superadmin settings can replace defaults.
export const TREAD_THRESHOLDS = {
  summer: { orangeFrom: 1.6, yellowFrom: 3, greenFrom: 5 },
  winter: { orangeFrom: 3, yellowFrom: 4, greenFrom: 6 },
} satisfies Record<TireSeason, { orangeFrom: number; yellowFrom: number; greenFrom: number }>;

export const TREAD_TITLES: Record<Level, string> = {
  green: "Helt OK", yellow: "OK", orange: "Inte bra", red: "Slitet / Olagligt",
};
export const TREAD_SHORT: Record<TireSeason, Record<Level, string>> = {
  summer: { green: "Bra mönster", yellow: "Fungerar, närmar sig bytesgräns", orange: "Varning! Byt snarast", red: "Under laglig gräns" },
  winter: { green: "Utmärkt grepp", yellow: "Bra grepp, lameller slits", orange: "Varning! Byt inför säsongen", red: "Under laglig gräns" },
};
export const TREAD_GUIDE: Record<TireSeason, { color: Level; range: string; text: string }[]> = {
  summer: [
    { color: "green", range: "≥ 5,0 mm", text: "Bra mönster, utmärkt vattenavledning och säkerhet." },
    { color: "yellow", range: "3,0 – 4,9 mm", text: "Fullt fungerande. Håller sannolikt resten av säsongen, men börjar närma sig rekommenderad bytesgräns." },
    { color: "orange", range: "1,6 – 2,9 mm", text: "Varning! Kraftigt ökad risk för vattenplaning vid regn. Rekommenderas att bytas snarast." },
    { color: "red", range: "< 1,6 mm", text: "Under laglig gräns (1,6 mm). Körförbud/bötesrisk och trafikfarligt." },
  ],
  winter: [
    { color: "green", range: "≥ 6,0 mm", text: "Utmärkt grepp i snö och modd." },
    { color: "yellow", range: "4,0 – 5,9 mm", text: "Bra grepp för normal vinterkörning, men lamellerna har börjat slitas ner." },
    { color: "orange", range: "3,0 – 3,9 mm", text: "Varning! Ligger precis vid eller strax över lagkravet (3,0 mm). Räckvidden och greppet på halka är avsevärt försämrat. Byt inför säsongen." },
    { color: "red", range: "< 3,0 mm", text: "Under laglig gräns för vinterväglag (3,0 mm). Trafikfarligt och olagligt att framföra i vinterväglag." },
  ],
};

export function tireSeason(tire: string): TireSeason | null {
  if (/vinter/i.test(tire)) return "winter";
  if (/sommar/i.test(tire)) return "summer";
  return null;
}

export function treadColor(depth: number | null | undefined, season: TireSeason | null): TreadColor {
  if (depth == null || !Number.isFinite(depth) || depth < 0 || !season) return "unknown";
  const limits = TREAD_THRESHOLDS[season];
  if (depth < limits.orangeFrom) return "red";
  if (depth < limits.yellowFrom) return "orange";
  if (depth < limits.greenFrom) return "yellow";
  return "green";
}
