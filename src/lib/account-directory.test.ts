import { describe, expect, it } from "vitest";
import { accountGroup, accountMatches, type AccountRow } from "./account-directory";

const row: AccountRow = { id: "1", display_name: "Anna Åström", email: "anna@example.test", phone: "070-123 45 67", street: "Testvägen 1", postal_code: "438 32", city: "Landvetter", roles: ["kund"], registrations: ["ABC123"], models: ["Volvo V60"] };
describe("account directory", () => {
  it("groups both admin roles together", () => { expect(accountGroup(["superadmin"])).toBe("admins"); expect(accountGroup(["useradmin"])).toBe("admins"); });
  it("groups mechanics separately", () => expect(accountGroup(["mekaniker"])).toBe("mekaniker"));
  it("groups customers separately", () => expect(accountGroup(["kund"])).toBe("kunder"));
  it("groups screens and accounts without roles as other", () => { expect(accountGroup(["skarm"])).toBe("ovrigt"); expect(accountGroup([])).toBe("ovrigt"); });
  it("searches person names", () => expect(accountMatches(row, "anna astrom")).toBe(true));
  it("searches formatted registration numbers", () => expect(accountMatches(row, "ABC 123")).toBe(true));
  it("searches formatted phone numbers", () => expect(accountMatches(row, "0701234567")).toBe(true));
  it("searches city", () => { expect(accountMatches(row, "landvetter")).toBe(true); expect(accountMatches(row, "stockholm")).toBe(false); });
  it("supports combined fields", () => { expect(accountMatches(row, "anna ABC123")).toBe(true); expect(accountMatches(row, "anna XYZ999")).toBe(false); });
  it("searches email and model", () => { expect(accountMatches(row, "anna@example.test")).toBe(true); expect(accountMatches(row, "volvo v60")).toBe(true); });
});