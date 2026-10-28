import { describe, expect, it } from "vitest";
import { navItemsFor } from "./nav-access";
const paths = (r: Parameters<typeof navItemsFor>[0]) => navItemsFor(r).map((i) => i.to);

describe("menu access", () => {
  it("signed-out visitors only see booking", () => expect(paths([])).toEqual(["/boka"]));
  it("customers see booking and their own page", () => expect(paths(["kund"])).toEqual(["/boka", "/kund"]));
  it("mechanics lack settings and customer page", () => expect(paths(["mekaniker"])).toEqual(["/oversikt", "/boka", "/personal", "/ankomst"]));
  it("superadmin sees everything", () => expect(paths(["superadmin"])).toHaveLength(6));
});
