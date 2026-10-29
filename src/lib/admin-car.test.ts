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
describe("bred sökning", () => {
  const card = { regnr: "XYZ789", modell: "Volvo V60", lagerplats: "H21", kundnr: "1042", owner: "Anna Andersson", phone: "070-123 45 67", email: "anna@example.com", minDepth: null, tires: [] };
  const cards = new Map([["XYZ789", card]]);
  it("hittar på kundnamn", () => expect(searchCars("anna", [], cards, new Map())).toEqual(["XYZ789"]));
  it("hittar på lagerplats", () => expect(searchCars("h21", [], cards, new Map())).toEqual(["XYZ789"]));
  it("hittar på kundnummer", () => expect(searchCars("1042", [], cards, new Map())).toEqual(["XYZ789"]));
  it("hittar på modell", () => expect(searchCars("volvo", [], cards, new Map())).toEqual(["XYZ789"]));
  it("hittar på telefon", () => expect(searchCars("0701234567", [], cards, new Map())).toEqual(["XYZ789"]));
});
