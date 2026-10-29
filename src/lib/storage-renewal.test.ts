import { describe, expect, it } from "vitest";
import { canRenewStorage, renewalInput } from "./storage-renewal";

describe("customer storage renewal", () => {
  it("requires explicit approval of a new storage season", () => {
    expect(renewalInput.safeParse({ regnr: "ABC123", season: "2027-spring", accepted: false, version: "v1" }).success).toBe(false);
    expect(renewalInput.safeParse({ regnr: "ABC123", season: "2027-spring", accepted: true, version: "v1" }).success).toBe(true);
  });
  it("only allows the customer's own car in storage", () => {
    const cars = [{ regnr: "ABC123", lagerplats: "A12" }, { regnr: "DEF456", lagerplats: "" }];
    expect(canRenewStorage(cars, "ABC123")).toBe(true);
    expect(canRenewStorage(cars, "DEF456")).toBe(false);
    expect(canRenewStorage(cars, "OTHER1")).toBe(false);
  });
});