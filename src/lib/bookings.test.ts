import { describe, it, expect } from "vitest";
import { buildCarCards, classifyService, guessColumns, listToCsv, listToText, normalizeRegnr, parseDepth, parseSwedishDate, uniqueRegnrs, withEmptySlots, type Booking } from "./bookings";

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
    expect(listToCsv(rows)).toContain('"07:15";"";"";""');
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
    expect(listToText(list, false).split("\n")[0]).toBe("24 oktober, 2026 09:00  ABC123  Skifte"));
  it("csv har BOM, rubrik och semikolumner", () => {
    const csv = listToCsv(list);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.replace(/^\uFEFF/, "").split("\r\n")[0]).toBe('"Datum";"Tid";"Regnr";"Tjänst";"Kund"');
    expect(csv).toContain('"24 oktober, 2026";"09:00";"ABC123";"Skifte";"Kund"');
  });
  it("csv får lagerplatskolonn när plats anges", () => {
    const csv = listToCsv(list, (r) => (r === "ABC123" ? "A3" : ""));
    expect(csv.replace(/^\uFEFF/, "").split("\r\n")[0]).toContain('"Lagerplats"');
    expect(csv).toContain('";"A3"');
  });
});


const DETALJERAD = (regnr: string, plat: string, djup: string) =>
  ["HF", "VF", "HB", "VB"].map((p) => ({
    "Reg.nr": regnr, "Däcktyp": "Sommar", "Lagerplats": plat, "Placering": p,
    "Dimension": "235", "Profil": "50", "Radie": "19", "Märke": "MICHELIN",
    "Mönsterdjup": djup, "Inlämnad": "2026-10-26", "Fabrikat / Modell": "SPORTAGE",
    "Kundnr": "OJY442", "Namn ägare": "KJELLBERG, ULF GREGER",
    "Telefon ägare": "0705450243", "E-post ägare": "",
  }));

const BANTAD = {
  "Regnr": "ABH63R", "Fabrikat": "MODEL Y", "Minsta mönsterdjup": "5,5", "Lagerplats": "M07",
  "Kundnr": "ABH63R", "Namn ägare": "ROHDIN, LARS NIKLAS",
  "Telefon ägare": "0705371395", "Startdatum": "2022-11-24",
};

describe("buildCarCards", () => {
  it("slår ihop 4 hjulrader till ett däckkort", () => {
    const card = buildCarCards(DETALJERAD("AAS31X", "H21", "4,0 mm")).get("AAS31X");
    expect(card?.tires.map((t) => t.position)).toEqual(["VF", "HF", "VB", "HB"]);
    expect(card?.tires[0]?.dimension).toBe("235/50 R19");
    expect(card?.tires[0]?.depth).toBe(4);
    expect(card?.tires[0]?.marke).toBe("MICHELIN");
    expect(card?.lagerplats).toBe("H21");
    expect(card?.modell).toBe("SPORTAGE");
    expect(card?.owner).toBe("KJELLBERG, ULF GREGER");
    expect(card?.minDepth).toBe(4);
  });
  it(" Detaljerad: minsta djupet är det lägsta hjulet", () => {
    const rows = [...DETALJERAD("AAS31X", "H21", "4,0 mm")];
    rows[0] = { ...rows[0]!, "Mönsterdjup": "2,5 mm" };
    expect(buildCarCards(rows).get("AAS31X")?.minDepth).toBe(2.5);
  });
  it("bantad lista ger kort utan hjul men med minsta mönsterdjup", () => {
    const card = buildCarCards([BANTAD]).get("ABH63R");
    expect(card?.tires).toEqual([]);
    expect(card?.minDepth).toBe(5.5);
    expect(card?.lagerplats).toBe("M07");
    expect(card?.modell).toBe("MODEL Y");
    expect(card?.phone).toBe("0705371395");
  });
  it("rader sorteras per bil och tomma regnummer struntar man i", () => {
    const cards = buildCarCards([
      ...DETALJERAD("AAS31X", "H21", "4,0 mm"),
      ...DETALJERAD("ABH63R", "M07", "5,5 mm"),
      { "Reg.nr": "", "Placering": "HF" },
    ]);
    expect([...cards.keys()]).toEqual(["AAS31X", "ABH63R"]);
    expect(cards.get("AAS31X")?.tires.length).toBe(4);
    expect(cards.get("ABH63R")?.minDepth).toBe(5.5);
  });

  it("tom fil ger inga kort", () => expect(buildCarCards([]).size).toBe(0));
});

describe("guessColumns", () => {
  it("väljer Reg.nr och Lagerplats i detaljerad export", () => {
    const h = Object.keys(DETALJERAD("A", "H1", "4,0 mm")[0]!);
    expect(guessColumns(h)).toEqual({ reg: "Reg.nr", plats: "Lagerplats" });
  });
  it("väljer Regnr och Lagerplats i bantad export", () =>
    expect(guessColumns(Object.keys(BANTAD))).toEqual({ reg: "Regnr", plats: "Lagerplats" }));
});

describe("parseDepth", () => {
  it("läser svenska decimaler och mm-suffix", () => {
    expect(parseDepth("4,0 mm")).toBe(4);
    expect(parseDepth("5,5")).toBe(5.5);
    expect(parseDepth(7)).toBe(7);
    expect(parseDepth("")).toBeNull();
    expect(parseDepth(undefined)).toBeNull();
  });
});
