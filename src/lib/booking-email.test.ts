import { describe, expect, it } from "vitest";
import { buildConfirmation } from "./booking-email";

const b = { name: "Anna <x>", regnr: "ABC123", date: "2026-11-03", time: "09:30", service: "Skifte", siteUrl: "https://ex.se/" };

describe("bekräftelsemail", () => {
  it("innehåller regnr, tid och tjänst i ämne och text", () => {
    const m = buildConfirmation(b, { company: "Däckverkstan", phone: "010-1" });
    expect(m.subject).toBe("Bokningsbekräftelse ABC123 – 2026-11-03 kl. 09:30");
    expect(m.text).toContain("Tjänst: Skifte");
    expect(m.text).toContain("https://ex.se/kund");
  });
  it("escapar kundens namn i html", () => {
    expect(buildConfirmation(b, {}).html).toContain("Anna &lt;x&gt;");
  });
});
