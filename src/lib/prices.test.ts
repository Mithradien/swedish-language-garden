import { describe, expect, it } from "vitest";
import { priceForSize, priceText, rimInch } from "./prices";

describe("prislista", () => {
  it("Skifte 17 tum = 395 kr", () => expect(priceForSize("Skifte", 17)).toBe(395));
  it("Skifte 18 tum = 495 kr", () => expect(priceForSize("Skifte", 18)).toBe(495));
  it("Skifte och förvaring 17/19/20 tum", () => {
    expect(priceForSize("Skifte och förvaring", 17)).toBe(795);
    expect(priceForSize("Skifte och förvaring", 19)).toBe(895);
    expect(priceForSize("Skifte och förvaring", 20)).toBe(995);
  });
  it("okänd bil ger från-pris", () => expect(priceText("Skifte och förvaring", null)).toBe("från 795 kr"));
  it("läser tum ur dimension", () => expect(rimInch("205/55 R16")).toBe(16));
});
