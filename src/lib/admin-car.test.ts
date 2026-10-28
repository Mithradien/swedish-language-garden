import { describe, expect, it } from "vitest";
import { carBookings, searchCars } from "./admin-car";
import { buildCarCards, type Booking } from "./bookings";

const booking = (regnr: string, date = "2026-10-28"): Booking => ({ regnr, date, dateLabel: date, start: "07:00", end: "07:30", name: regnr, phone: "", service: "Skifte" });
describe("Administratörens bilval", () => {
  it("visar bara exakt bilens bokningar, även från andra dagar", () => {
    const own = [booking("ABC123"), booking("abc 123", "2025-10-10")];
    expect(carBookings("ABC 123", [...own, booking("ABC1234"), booking("DEF456")])).toEqual(own);
    expect(carBookings("", own)).toEqual([]);
  });
  it("hittar även Excel-bilar utan bokning och ger ett resultat per regnummer", () => {
    const cards = buildCarCards([{ Regnr: "ABC124", Lagerplats: "B2" }]);
    expect(searchCars("abc", [booking("ABC123"), booking("ABC123")], cards, new Map([["ABC125", "C3"]]))).toEqual(["ABC123", "ABC124", "ABC125"]);
    expect(searchCars("", [booking("ABC123")], cards, new Map())).toEqual([]);
  });
});