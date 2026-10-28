import { tireSeason, treadColor, type TreadColor } from "@/lib/tread";

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
const TREAD_LABELS: Record<TreadColor, string> = {
  red: "Röd", orange: "Orange", yellow: "Gul", green: "Grön", unknown: "Ej bedömt",
};
export function TreadReading({ depth, tire }: { depth: number | null | undefined; tire: string }) {
  const color = treadColor(depth, tireSeason(tire));
  return <div className="mt-1"><p className="font-display text-2xl font-semibold">{depth?.toLocaleString("sv-SE") ?? "—"} <span className="text-base font-normal">mm</span></p><p className="mt-1 flex items-center gap-2 text-xs font-medium"><span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${TREAD_DOTS[color]}`}/>{TREAD_LABELS[color]}</p></div>;
}