import { z } from "zod";

export const renewalInput = z.object({
  regnr: z.string().trim().min(2).max(12).transform(s => s.toUpperCase().replace(/[^A-Z0-9ÅÄÖ]/g, "")),
  season: z.string().regex(/^\d{4}-(spring|autumn)$/),
  accepted: z.literal(true),
  version: z.string().max(200),
});
export function renewalSeasons(now = new Date()) {
  const year = Number(now.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" }).slice(0, 4));
  return [year, year + 1].flatMap(y => [`${y}-spring`, `${y}-autumn`]);
}
export function renewalSeasonLabel(season: string) {
  const [year, part] = season.split("-");
  return `${part === "spring" ? "Vår" : "Höst"} ${year}`;
}
export function canRenewStorage(cars: { regnr: string; lagerplats: string }[], regnr: string) {
  return cars.some(c => c.regnr === regnr && c.lagerplats.trim().length > 0);
}