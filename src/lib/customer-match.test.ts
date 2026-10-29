import { describe, expect, it } from "vitest";
import { matchesContact, normPhone } from "./customer-match";

describe("customer matching", () => {
  it("matches e-mail case-insensitively", () => {
    expect(matchesContact({ email: "Anna@Example.com", phone: "" }, { email: "anna@example.com " })).toBe(true);
  });
  it("matches phone across +46 and 0 formats", () => {
    expect(normPhone("+46 70-123 45 67")).toBe(normPhone("070-1234567"));
    expect(matchesContact({ email: "", phone: "070 123 45 67" }, { phone: "+46701234567" })).toBe(true);
  });
  it("does not match on empty or short values", () => {
    expect(matchesContact({ email: "", phone: "" }, { email: "", phone: "" })).toBe(false);
    expect(matchesContact({ email: "", phone: "123" }, { phone: "123" })).toBe(false);
  });
  it("does not match someone else", () => {
    expect(matchesContact({ email: "a@x.se", phone: "0701111111" }, { email: "b@x.se", phone: "0702222222" })).toBe(false);
  });
});

import { claimStatus } from "./customer-match";
describe("koppla bil till konto", () => {
  const me = { email: "anna@example.com", phone: "070-123 45 67" };
  it("okänd bil kopplas direkt", () => expect(claimStatus(me, null)).toBe("kopplad"));
  it("samma e-post kopplas direkt", () => expect(claimStatus(me, { email: "ANNA@example.com", phone: "" })).toBe("kopplad"));
  it("andras bil väntar på godkännande", () => expect(claimStatus(me, { email: "bertil@example.com", phone: "0709999999" })).toBe("vantar"));
});
