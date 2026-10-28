import { TREAD_GUIDE, TREAD_SHORT, TREAD_TITLES, tireSeason, treadColor, type TreadColor } from "@/lib/tread";

export const TREAD_STYLES: Record<TreadColor, string> = {
  red: "border-tread-red bg-tread-red/10 text-tread-red",
  orange: "border-tread-orange bg-tread-orange/10 text-tread-orange",
  yellow: "border-tread-yellow bg-tread-yellow/20 text-foreground",
  green: "border-tread-green bg-tread-green/10 text-tread-green",
  unknown: "border-border text-muted-foreground",
};
const TREAD_DOTS: Record<TreadColor, string> = {
  red: "bg-tread-red", orange: "bg-tread-orange", yellow: "bg-tread-yellow",
  green: "bg-tread-green", unknown: "bg-muted-foreground",
};
export function TreadReading({ depth, tire }: { depth: number | null | undefined; tire: string }) {
  const season = tireSeason(tire);
  const color = treadColor(depth, season);
  const label = color === "unknown" || !season ? "Ej bedömt" : `${TREAD_TITLES[color]} · ${TREAD_SHORT[season][color]}`;
  return <div className="mt-1"><p className="font-display text-2xl font-semibold">{depth?.toLocaleString("sv-SE") ?? "—"} <span className="text-base font-normal">mm</span></p><p className="mt-1 flex items-center gap-2 text-xs font-medium"><span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${TREAD_DOTS[color]}`}/>{label}</p></div>;
}

export function TreadGuide({ tire }: { tire: string }) {
  const season = tireSeason(tire);
  if (!season) return null;
  return <section className="rounded-md border p-4"><h4 className="mb-3 font-semibold">{season === "summer" ? "Sommardäck" : "Vinterdäck (friktion & dubb)"} – vad färgerna betyder</h4><ul className="space-y-3">{TREAD_GUIDE[season].map(g => <li key={g.color} className="flex gap-3 text-sm"><span aria-hidden="true" className={`mt-1 h-3 w-3 shrink-0 rounded-full ${TREAD_DOTS[g.color]}`}/><span><b>{TREAD_TITLES[g.color]}</b> <span className="text-muted-foreground">({g.range})</span><br/>{g.text}</span></li>)}</ul></section>;
}
