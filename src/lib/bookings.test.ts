import { describe, it, expect } from "vitest";
import { classifyService, parseSwedishDate, normalizeRegnr, uniqueRegnrs, listToText, listToCsv, withEmptySlots, type Booking } from "./bookings";

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

describe("obokade schematider", () => {
  const booking = { ...mk("ABC123", "Skifte"), start: "7:00", end: "07:30" };
  it("visar exakt 27 tider med raster och sista start 15:30", () => {
    const rows = withEmptySlots([booking]);
    expect(rows).toHaveLength(27);
    expect(rows.map(r => r.start)).toEqual([
      "7:00", "07:15", "07:30", "07:45", "08:00", "08:15",
      "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15",
      "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30",
    ]);
    expect(rows.at(-1)?.end).toBe("16:00");
  });
  it("obokade tider är 30 minuter och har tomma uppgifter", () => {
    const rows = withEmptySlots([booking]);
    expect(rows[1]).toEqual({ date: booking.date, dateLabel: booking.dateLabel, start: "07:15", end: "07:45", regnr: "", name: "", service: "", phone: "" });
    expect(rows.filter(r => r.service === "")).toHaveLength(26);
    expect(listToCsv(rows)).toContain('"07:15-07:45";"";"";""');
    expect(uniqueRegnrs(rows)).toEqual(["ABC123"]);
  });
  it("behåller dubbelbokningar och bokningar utanför schemat utan att ändra importen", () => {
    const input = [booking, { ...booking, regnr: "XYZ789" }, { ...booking, start: "09:00", end: "09:30" }];
    const rows = withEmptySlots(input);
    expect(rows).toHaveLength(29);
    expect(rows.filter(r => r.service !== "")).toEqual(input);
    expect(input).toHaveLength(3);
  });
  it("kompletterar varje importerad dag separat och skapar inga dagar utan import", () => {
    const rows = withEmptySlots([booking, { ...booking, date: "2026-10-26" }]);
    expect(rows.filter(r => r.date === "2026-10-24")).toHaveLength(27);
    expect(rows.filter(r => r.date === "2026-10-26")).toHaveLength(27);
    expect(withEmptySlots([])).toEqual([]);
  });
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
    expect(csv.replace(/^\uFEFF/, "").split("\r\n")[0]).toBe('"Datum";"Tid";"Regnr";"Tjänst";"Kund"');
    expect(csv).toContain('"24 oktober, 2026";"09:00-10:00";"ABC123";"Skifte";"Kund"');
  });
  it("csv får lagerplatskolonn när plats anges", () => {
    const csv = listToCsv(list, (r) => (r === "ABC123" ? "A3" : ""));
    expect(csv.replace(/^\uFEFF/, "").split("\r\n")[0]).toContain('"Lagerplats"');
    expect(csv).toContain('";"A3"');
  });
});

