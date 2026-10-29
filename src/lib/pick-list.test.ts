import { describe, it, expect } from "vitest";
import { buildPickList, nextDay } from "./pick-list";
import type { Booking, CarCard } from "./bookings";

const b = (regnr: string, start: string, service: Booking["service"] = "Skifte och förvaring"): Booking => ({ name: "A", regnr, date: "2026-10-30", dateLabel: "", start, end: "", service, phone: "" });
const c = (regnr: string, lagerplats: string): CarCard => ({ regnr, modell: "", lagerplats, kundnr: "", owner: "", phone: "", email: "", minDepth: null, tires: [] });
const key = (x: Booking) => x.start + x.regnr;

describe("plocklista", () => {
  const cards = new Map([["ABC123", c("ABC123", "B12")], ["DEF456", c("DEF456", "A2")], ["GHI789", c("GHI789", "")]]);
  it("sorterar efter lagerplats och hoppar över bilar utan plats", () => {
    expect(buildPickList([b("ABC123", "08:00"), b("DEF456", "09:00"), b("GHI789", "10:00")], cards, new Set(), key).map(r => r.regnr)).toEqual(["DEF456", "ABC123"]);
  });
  it("tar inte med avbokade eller nyförvaring", () => {
    expect(buildPickList([b("ABC123", "08:00"), b("DEF456", "09:00", "Nyförvaring")], cards, new Set(["08:00ABC123"]), key)).toEqual([]);
  });
  it("nästa dag över månadsskifte", () => { expect(nextDay("2026-10-31")).toBe("2026-11-01"); });
});
