import { BOARD_STAGES, type BoardCar, type BoardStage } from "./workshop-board";

export const ARRIVAL_STATUSES = { vantas: "Väntas", ankommen: "Ankommen", sen: "Sen ankomst", ej: "Ej ankommen" };
export interface ScreenSettings {
  title: string;
  interval: number;
  statuses: string[];
  columns: Record<BoardStage, { label: string; visible: boolean; limit: number }>;
}
export const DEFAULT_SCREEN: ScreenSettings = {
  title: "Kundmottagning", interval: 10, statuses: ["vantas", "ankommen", "sen"],
  columns: { vantas: { label: "Väntas", visible: true, limit: 5 }, ankommen: { label: "Ankommen", visible: true, limit: 0 }, paborjad: { label: "Pågående", visible: true, limit: 0 }, klar: { label: "Klar för avhämtning", visible: true, limit: 0 } },
};
export function parseScreenSettings(value: unknown): ScreenSettings {
  const v = value as Partial<ScreenSettings> | null;
  const text = (s: unknown, fallback: string) => typeof s === "string" && s.trim() ? s.trim().slice(0, 60) : fallback;
  const columns = { ...DEFAULT_SCREEN.columns };
  for (const key of BOARD_STAGES) {
    const c = v?.columns?.[key]; const fallback = DEFAULT_SCREEN.columns[key];
    columns[key] = { label: text(c?.label, fallback.label), visible: typeof c?.visible === "boolean" ? c.visible : fallback.visible, limit: Number.isInteger(c?.limit) && Number(c?.limit) >= 0 && Number(c?.limit) <= 100 ? Number(c?.limit) : fallback.limit };
  }
  if (!BOARD_STAGES.some(k => columns[k].visible)) columns.vantas.visible = true;
  return { title: text(v?.title, DEFAULT_SCREEN.title), interval: Number.isInteger(v?.interval) && Number(v?.interval) >= 5 && Number(v?.interval) <= 300 ? Number(v?.interval) : 10, statuses: Array.isArray(v?.statuses) ? v.statuses.filter(s => s in ARRIVAL_STATUSES) : [...DEFAULT_SCREEN.statuses], columns };
}
export function receptionCars(cars: BoardCar[], settings: ScreenSettings, now: Date) {
  const time = now.toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" });
  return cars.filter(c => settings.statuses.includes(c.arrival) && settings.columns[c.stage].visible && (c.stage !== "vantas" || c.start_time.slice(0, 5) >= time)).sort((a, b) => a.start_time.localeCompare(b.start_time));
}
export function screenColumn(cars: BoardCar[], stage: BoardStage, settings: ScreenSettings) {
  const rows = cars.filter(c => c.stage === stage);
  return settings.columns[stage].limit > 0 ? rows.slice(0, settings.columns[stage].limit) : rows;
}