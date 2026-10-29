import { classifyService, normalizeRegnr, WORK_PASSES, SLOT_STEP, type Service } from "./bookings";

/** Minsta framförhållning för kundbokning: 48 timmar. */
export const LEAD_HOURS = 48;

/** Öppna dagar: måndag–fredag (söndag = 0). */
export const OPEN_WEEKDAYS = [1, 2, 3, 4, 5];

export interface Choice {
  id: string;
  label: string;
  hint: string;
  /** Formulering som classifyService förstår. */
  answer: string;
}

/** Fråga 1: däcken som ska monteras på bilen. */
export const TILL_CHOICES: Choice[] = [
  { id: "med", label: "Jag har med däcken", hint: "Däcken finns i bilen eller hemma", answer: "har jag med mig" },
  { id: "hosEr", label: "Däcken finns hos er", hint: "Ni hämtar dem ur däckhotellet", answer: "är förvarade hos er" },
];

/** Fråga 2: däcken som tas av bilen. */
export const FRAN_CHOICES: Choice[] = [
  { id: "tarMed", label: "Jag tar med däcken", hint: "Du vill ha med dig däcken när du går", answer: "vill jag förvara själv" },
  { id: "lamna", label: "Däcken stannar hos er", hint: "Vi ställer in dem i däckhotellet", answer: "vill jag förvara hos er" },
];

/** Tillfälliga priser – byt mot verkstadens prislista när den är klar. */
export const PRICES: Record<string, number> = {
  "Skifte": 590,
  "Skifte och förvaring": 890,
  "Nyförvaring": 1290,
  "Avsluta förvaring": 350,
};

export function priceFor(service: Service): number {
  return PRICES[service] ?? 0;
}

/** Rasterna infaller efter angiven tid på dagen. */
export const BREAKS: { label: string; time: string; after: string }[] = [
  { label: "Frukost", time: "09:00–09:15", after: "08:15" },
  { label: "Lunch", time: "11:45–12:45", after: "11:15" },
];

const toMin = (time: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0) : NaN;
};
const toLabel = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

/** Dagens samtliga schematider – 27 stycken. */
export function scheduleTimes(): string[] {
  const out: string[] = [];
  for (const [first, last] of WORK_PASSES) for (let t = first; t <= last; t += SLOT_STEP) out.push(toLabel(t));
  return out;
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDaysIso(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function isOpenDay(date: string): boolean {
  return OPEN_WEEKDAYS.includes(new Date(`${date}T12:00:00`).getDay());
}

/** Tidigaste datum det går att boka, med 48 h framförhållning. */
export function earliestDate(now: Date = new Date()): string {
  return isoDate(new Date(now.getTime() + LEAD_HOURS * 3600 * 1000));
}

/** Första öppna dag från och med tidigaste bokningsbara datum. */
export function firstOpenDay(now: Date = new Date()): string {
  let d = earliestDate(now);
  for (let i = 0; i < 14 && !isOpenDay(d); i++) d = addDaysIso(d, 1);
  return d;
}

/** Finns det någon ledig tid den dagen, med 48-h-regeln beaktad? */
export function hasBookableTime(date: string, now: Date = new Date()): boolean {
  return slotsForDate(date, now).some((s) => s.state === "ledig");
}

/** Bokningsbara dagar framåt. Dagar utan ledig tid hoppas över. */
export function openDays(now: Date = new Date(), count = 10): string[] {
  const out: string[] = [];
  let d = firstOpenDay(now);
  while (out.length < count) {
    if (isOpenDay(d) && hasBookableTime(d, now)) out.push(d);
    d = addDaysIso(d, 1);
  }
  return out;
}

export type SlotState = "ledig" | "upptagen" | "last";
export interface Slot { time: string; state: SlotState }

/**
 * Tiderna för en dag med status.
 * `taken` = redan bokade, `locked` = tiderna personalen låst.
 * Tider som ligger mindre än 48 h fram är låsta av sig själva.
 */
export function slotsForDate(
  date: string,
  now: Date = new Date(),
  taken: string[] = [],
  locked: string[] = [],
): Slot[] {
  const limit = new Date(now.getTime() + LEAD_HOURS * 3600 * 1000);
  const limitMin = limit.getHours() * 60 + limit.getMinutes();
  const isLimitDay = isoDate(limit) === date;
  const takenSet = new Set(taken);
  const lockedSet = new Set(locked);
  return scheduleTimes().map((time) => ({
    time,
    state: takenSet.has(time)
      ? "upptagen"
      : lockedSet.has(time) || (isLimitDay && toMin(time) < limitMin)
        ? "last"
        : "ledig",
  }));
}

const answerOf = (list: Choice[], id: string) => list.find((c) => c.id === id)?.answer ?? "";

/** Tjänsten som blir resultatet av de två svaren. */
export function serviceFor(tillId: string, franId: string): Service {
  return classifyService(answerOf(TILL_CHOICES, tillId), answerOf(FRAN_CHOICES, franId));
}

/** Har bilen inga däck hos er finns bara ett svar på fråga 1 – då hoppar flödet över den. */
export function tillChoicesFor(hasStoredTires: boolean): Choice[] {
  return hasStoredTires ? TILL_CHOICES : TILL_CHOICES.filter((c) => c.id === "med");
}

/** Fråga 2 har alltid båda svaren: du kan alltid lämna in däck eller ta med dig dem. */
export function franChoicesFor(_hasStoredTires: boolean): Choice[] {
  return FRAN_CHOICES;
}

/** Tjänster en kund med den här bilens läge faktiskt kan välja. */
export function availableServices(hasStoredTires: boolean): Service[] {
  const out = new Set<Service>();
  for (const t of tillChoicesFor(hasStoredTires)) for (const f of FRAN_CHOICES) out.add(serviceFor(t.id, f.id));
  return [...out].filter((s) => s !== "Okänd");
}

export interface DemoCar {
  regnr: string;
  modell: string;
  lagerplats: string;
  harDack: boolean;
  namn: string;
  telefon: string;
  epost: string;
}

/** Exempelregister för skissen – ersätts av er egen databas. */
export const DEMO_CARS: DemoCar[] = [
  { regnr: "ABC123", modell: "Volvo V60", lagerplats: "H21", harDack: true, namn: "Anna Andersson", telefon: "070-123 45 67", epost: "anna@example.com" },
  { regnr: "DEF456", modell: "Volkswagen Golf", lagerplats: "M07", harDack: true, namn: "Bertil Bengtsson", telefon: "070-234 56 78", epost: "bertil@example.com" },
  { regnr: "GHI789", modell: "Tesla Model 3", lagerplats: "", harDack: false, namn: "Carina Carlsson", telefon: "070-345 67 88", epost: "carina@example.com" },
];

export function findDemoCar(regnr: string): DemoCar | undefined {
  const key = normalizeRegnr(regnr);
  return DEMO_CARS.find((c) => c.regnr === key);
}

export function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
}

export function longDayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Nuvarande väggklocka i Stockholm som ett Date-objekt (lokala getters = svensk tid), så servern räknar 48 h som kunden. */
export function stockholmNow(now: Date = new Date()): Date {
  const p = Object.fromEntries(new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now).map((x) => [x.type, x.value]));
  return new Date(Number(p["year"]), Number(p["month"]) - 1, Number(p["day"]), Number(p["hour"]), Number(p["minute"]));
}

/** Sluttid för en kundbokning (30 min). */
export function endTimeFor(start: string): string {
  return toLabel(toMin(start) + 30);
}

/** Kan just denna tid bokas av en kund? Samma regel som tidsrutnätet visar. */
export function isBookable(date: string, time: string, now: Date, taken: string[]): boolean {
  if (!isOpenDay(date)) return false;
  return slotsForDate(date, now, taken).some((s) => s.time === time && s.state === "ledig");
}

/** Personalen flyttar en bokning: öppen dag, en tid i schemat och inte redan tagen. 48h-gränsen gäller inte personal. */
export function canStaffMoveTo(date: string, time: string, taken: string[]): boolean {
  return isOpenDay(date) && scheduleTimes().includes(time) && !taken.includes(time);
}

/** Noteringen som sparas på en flyttad bokning. */
export function moveNote(prev: string | null, fromDate: string, fromTime: string): string {
  const line = `Flyttad från ${fromDate} ${fromTime}`;
  return prev ? `${prev}\n${line}` : line;
}
