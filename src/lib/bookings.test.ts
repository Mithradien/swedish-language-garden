import { describe, it, expect } from "vitest";
import { classifyService, parseSwedishDate, normalizeRegnr, uniqueRegnrs, listToText, listToCsv, type Booking } from "./bookings";

const STORED = "är förvarade hos Landvetter Däckservice/Daniels Bilservice";
const OWN = "har jag med mig";
const STORE = "vill jag förvara hos Landvetter Däckservice";
const SELF = "vill jag förvara själv";

describe("classifyService", () => {
  it("förvarade + förvara hos oss = Skifte och förvaring", () =>
    expect(classifyService(STORED, STORE)).toBe("Skifte och förvaring"));
  it("med sig + förvara hos oss = Nyförvaring", () => expect(classifyService(OWN, STORE)).toBe("Nyförvaring"));
  it("förvarade + förvara själv = Avsluta förvaring", () =>
    expect(classifyService(STORED, SELF)).toBe("Avsluta förvaring"));
  it("med sig + förvara själv = Skifte", () => expect(classifyService(OWN, SELF)).toBe("Skifte"));
});

it("parses Swedish dates", () => expect(parseSwedishDate("1 oktober, 2018")).toBe("2018-10-01"));
it("normalizes regnr", () => expect(normalizeRegnr("rcc 988")).toBe("RCC988"));

const mk = (regnr: string, service: Booking["service"]): Booking => ({
  name: "Kund", regnr, date: "2026-10-24", dateLabel: "24 oktober, 2026",
  start: "09:00", end: "10:00", service, phone: "",
});

describe("listor", () => {
  const list = [mk("ABC123", "Skifte"), mk("XYZ789", "Nyförvaring"), mk("ABC123", "Skifte"), mk("", "Skifte")];
  it("tar bort dubbletter och tomma regnummer", () => expect(uniqueRegnrs(list)).toEqual(["ABC123", "XYZ789"]));
  it("bara regnummer ger en rad per bil", () => expect(listToText(list, true)).toBe("ABC123\nXYZ789"));
  it("full lista har dag, tid, regnr och tjänst", () =>
    expect(listToText(list, false).split("\n")[0]).toBe("24 oktober, 2026 09:00-10:00  ABC123  Skifte"));
  it("csv har BOM, rubrik och semikolumner", () => {
    const csv = listToCsv(list);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.split("\r\n")[0]).toBe('"Datum";"Tid";"Regnr";"Tjänst";"Kund"');
    expect(csv).toContain('"24 oktober, 2026";"09:00-10:00";"ABC123";"Skifte";"Kund"');
  });
  it("csv får lagerplatskolonn när plats anges", () => {
    const csv = listToCsv(list, (r) => (r === "ABC123" ? "A3" : ""));
    expect(csv.split("\r\n")[0]).toContain('"Lagerplats"');
    expect(csv).toContain('";"A3"');
  });
});

