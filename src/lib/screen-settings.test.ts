import { describe, expect, it } from "vitest";
import { DEFAULT_SCREEN, parseScreenSettings, receptionCars, screenColumn } from "./screen-settings";
import type { BoardCar } from "./workshop-board";
const car = (time: string, arrival = "vantas"): BoardCar => ({ booking_key: time, regnr: "ABC123", start_time: time, service: "Skifte", stage: "vantas", arrival, lagerplats: "" });
const now = new Date("2026-10-29T08:00:00Z");
describe("kundmottagningens skärmvärden", () => {
  it("döljer Ej ankommen", () => expect(receptionCars([car("10:00", "ej"), car("10:15")], DEFAULT_SCREEN, now).map(c => c.start_time)).toEqual(["10:15"]));
  it("visar endast fem kommande under Väntas", () => {
    const cars = ["08:00", "09:00", "09:15", "09:30", "09:45", "10:00", "10:15"].reverse().map(t => car(t));
    expect(screenColumn(receptionCars(cars, DEFAULT_SCREEN, now), "vantas", DEFAULT_SCREEN).map(c => c.start_time)).toEqual(["09:00", "09:15", "09:30", "09:45", "10:00"]);
  });
  it("använder ändrat antal", () => { const s = parseScreenSettings({ columns: { vantas: { limit: 2 } } }); expect(screenColumn([car("10:00"), car("10:15"), car("10:30")], "vantas", s)).toHaveLength(2); });
  it("kan visa Ej ankommen om den väljs", () => { const s = parseScreenSettings({ statuses: ["ej"] }); expect(receptionCars([car("10:00", "ej")], s, now)).toHaveLength(1); });
});