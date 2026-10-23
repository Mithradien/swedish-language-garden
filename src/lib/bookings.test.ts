import { describe, it, expect } from "vitest";
import { classifyService, parseSwedishDate, normalizeRegnr } from "./bookings";

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
