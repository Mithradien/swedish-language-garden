import type { Service } from "./bookings";

/** Ett prissteg: gäller fälgar upp till och med `upTo` tum (null = och uppåt). */
export interface PriceTier { upTo: number | null; price: number }
export type PriceList = Record<string, PriceTier[]>;
export const PRICE_SERVICES = ["Skifte", "Skifte och förvaring", "Nyförvaring", "Avsluta förvaring"] as const;

export const DEFAULT_PRICES: PriceList = {
  "Skifte": [{ upTo: 17, price: 395 }, { upTo: null, price: 495 }],
  "Skifte och förvaring": [{ upTo: 17, price: 795 }, { upTo: 19, price: 895 }, { upTo: null, price: 995 }],
  // Tillfälliga – verkstaden har inte satt dessa än.
  "Nyförvaring": [{ upTo: null, price: 1290 }],
  "Avsluta förvaring": [{ upTo: null, price: 350 }],
};

export let PRICE_LIST: PriceList = DEFAULT_PRICES;

export function validPrices(v: unknown): PriceList | null {
  if (!v || typeof v !== "object") return null;
  const out: PriceList = {};
  for (const s of PRICE_SERVICES) {
    const tiers = (v as PriceList)[s];
    if (!Array.isArray(tiers) || !tiers.length) return null;
    for (const t of tiers) {
      if (!Number.isFinite(t.price) || t.price < 0) return null;
      if (t.upTo !== null && (!Number.isInteger(t.upTo) || t.upTo < 10 || t.upTo > 30)) return null;
    }
    const sorted = [...tiers].sort((a, b) => (a.upTo ?? 99) - (b.upTo ?? 99));
    if (sorted.filter((t) => t.upTo === null).length !== 1) return null;
    out[s] = sorted.map((t) => ({ upTo: t.upTo, price: t.price }));
  }
  return out;
}

export function applyPrices(v: unknown) {
  PRICE_LIST = validPrices(v) ?? DEFAULT_PRICES;
}

/** Fälgstorlek i tum ur en däckdimension, t.ex. "205/55 R16" → 16. */
export function rimInch(dimension: string): number | null {
  const m = /R\s?(\d{2})\b/i.exec(dimension) ?? /\b(1[2-9]|2[0-4])\s?("|tum)/i.exec(dimension);
  return m ? Number(m[1]) : null;
}

/** Exakt pris om fälgstorleken är känd, annars null. */
export function priceForSize(service: Service, inch: number | null, list: PriceList = PRICE_LIST): number | null {
  const tiers = list[service];
  if (!tiers?.length) return null;
  if (tiers.length === 1) return tiers[0]!.price;
  if (inch == null) return null;
  return (tiers.find((t) => t.upTo === null || inch <= t.upTo) ?? tiers[tiers.length - 1]!).price;
}

/** Lägsta pris för tjänsten. */
export function fromPrice(service: Service, list: PriceList = PRICE_LIST): number {
  return Math.min(...(list[service] ?? [{ price: 0 }]).map((t) => t.price));
}

/** Text till kunden: exakt pris för känd fälg, annars "från"-pris. */
export function priceText(service: Service, inch: number | null): string {
  const exact = priceForSize(service, inch);
  return exact != null ? `${exact} kr` : `från ${fromPrice(service)} kr`;
}

/** Beskrivning av ett prissteg, t.ex. "upp till 17 tum", "18–19 tum", "20 tum och uppåt". */
export function tierLabel(tiers: PriceTier[], i: number): string {
  const t = tiers[i]!;
  const prev = i > 0 ? tiers[i - 1]!.upTo : null;
  if (tiers.length === 1) return "alla storlekar";
  if (t.upTo === null) return `${(prev ?? 0) + 1} tum och uppåt`;
  if (prev == null) return `upp till ${t.upTo} tum`;
  return prev + 1 === t.upTo ? `${t.upTo} tum` : `${prev + 1}–${t.upTo} tum`;
}
