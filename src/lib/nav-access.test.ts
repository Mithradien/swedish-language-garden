import { describe, expect, it } from "vitest";
import { navItemsFor } from "./nav-access";
const paths = (r: Parameters<typeof navItemsFor>[0]) => navItemsFor(r).map((i) => i.to);

describe("menu access", () => {
  it("signed-out visitors only see booking", () => expect(paths([])).toEqual(["/boka"]));
  it("customers see booking and their own page", () => expect(paths(["kund"])).toEqual(["/boka", "/kund"]));
  it("mechanics lack settings and customer page", () => expect(paths(["mekaniker"])).toEqual(["/oversikt", "/boka", "/personal", "/verkstad", "/kundmottagning", "/ankomst"]));
  it("superadmin sees everything", () => expect(paths(["superadmin"])).toHaveLength(8));
  it("båda skärmarna ligger i personalens gemensamma skärmmeny", () => {
    for (const role of ["superadmin", "useradmin", "mekaniker"] as const) {
      expect(navItemsFor([role]).filter(item => item.group === "screens").map(item => item.to)).toEqual(["/verkstad", "/kundmottagning"]);
    }
    expect(paths(["kund"])).not.toContain("/kundmottagning");
    expect(paths([])).not.toContain("/kundmottagning");
  });
  it("verkstadsskärmen visas för personal, inte kunder eller besökare", () => {
    for (const role of ["superadmin", "useradmin", "mekaniker"] as const) expect(paths([role])).toContain("/verkstad");
    expect(paths(["kund"])).not.toContain("/verkstad");
    expect(paths([])).not.toContain("/verkstad");
  });
});

describe("användaradmin", () => {
  it("ser översikt, personal, ankomst och inställningar men inte Mina sidor", () => {
    const paths = navItemsFor(["useradmin"]).map((i) => i.to);
    expect(paths).toEqual(expect.arrayContaining(["/oversikt", "/personal", "/ankomst", "/installningar"]));
    expect(paths).not.toContain("/kund");
  });
});
