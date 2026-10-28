import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SIGNAL_PRESETS, readableOn } from "./settings";

describe("inställningar", () => {
  it("väljer mörk text på ljus signalfärg", () => {
    expect(readableOn("#f9cc21")).toBe("#1a1a1a");
  });

  it("väljer ljus text på mörk signalfärg", () => {
    expect(readableOn("#1a1a2e")).toBe("#f7f6f2");
  });

  it("klarar tom eller felformulerad färg utan att krascha", () => {
    expect(readableOn("")).toBe("#1a1a1a");
    expect(readableOn("rött")).toBe("#1a1a1a");
  });

  it("standardfärgen finns bland förslagen", () => {
    expect(SIGNAL_PRESETS.map((p) => p.hex)).toContain(DEFAULT_SETTINGS.signal);
  });
});
