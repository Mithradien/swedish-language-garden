import { describe, expect, it } from "vitest";
import {
  BREAKS, LEAD_HOURS, PRICES, availableServices, earliestDate, findDemoCar, firstOpenDay,
  franChoicesFor, hasBookableTime, isOpenDay, openDays, priceFor, scheduleTimes, serviceFor, slotsForDate,
  tillChoicesFor,
} from "./booking-flow";

const NOW = new Date("2026-10-27T09:00:00"); // tisdag

describe("schematider", () => {
  it("har exakt 27 tider från 07:00 till 15:30", () => {
    const times = scheduleTimes();
    expect(times).toHaveLength(27);
    expect(times[0]).toBe("07:00");
    expect(times[26]).toBe("15:30");
  });
  it("rasterna ligger efter 08:15 och efter 11:15", () => {
    expect(BREAKS.map((b) => b.after)).toEqual(["08:15", "11:15"]);
    expect(BREAKS.map((b) => b.time)).toEqual(["09:00–09:15", "11:45–12:45"]);
    for (const b of BREAKS) expect(scheduleTimes()).toContain(b.after);
  });
});

describe("48-timmarsregel", () => {
  it("tidigaste datum är två dygn fram", () => {
    expect(LEAD_HOURS).toBe(48);
    expect(earliestDate(NOW)).toBe("2026-10-29");
  });
  it("första öppna dag är en vardag", () => {
    expect(firstOpenDay(NOW)).toBe("2026-10-29");
    expect(isOpenDay("2026-10-31")).toBe(false); // lördag
    expect(isOpenDay("2026-11-01")).toBe(false); // söndag
  });
  it("dagslistan hoppar över helg", () => {
    expect(openDays(NOW, 5)).toEqual([
      "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03", "2026-11-04",
    ]);
  });
  it("dagar utan ledig tid hoppar dagslistan över", () => {
    const sen = new Date("2026-10-27T21:00:00"); // gräns 29/10 kl. 21:00 – hela dagen låst
    expect(hasBookableTime("2026-10-29", sen)).toBe(false);
    expect(openDays(sen, 3)).toEqual(["2026-10-30", "2026-11-02", "2026-11-03"]);
  });
  it("tider före 48 h är låsta, senare tider är lediga", () => {
    const slots = slotsForDate("2026-10-29", NOW);
    const state = (t: string) => slots.find((s) => s.time === t)?.state;
    expect(state("07:00")).toBe("last");
    expect(state("08:15")).toBe("last");
    expect(state("09:15")).toBe("ledig");
  });
  it("bokad och låst tid går inte att välja", () => {
    const slots = slotsForDate("2026-11-02", NOW, ["10:00"], ["13:00"]);
    const state = (t: string) => slots.find((s) => s.time === t)?.state;
    expect(state("10:00")).toBe("upptagen");
    expect(state("13:00")).toBe("last");
    expect(state("09:15")).toBe("ledig");
  });
});

describe("tjänsten räknas ut ur de två svaren", () => {
  it("med mig + tar med mig = Skifte", () => expect(serviceFor("med", "tarMed")).toBe("Skifte"));
  it("med mig + stannar hos er = Nyförvaring", () => expect(serviceFor("med", "lamna")).toBe("Nyförvaring"));
  it("hos er + stannar hos er = Skifte och förvaring", () => expect(serviceFor("hosEr", "lamna")).toBe("Skifte och förvaring"));
  it("hos er + tar med mig = Avsluta förvaring", () => expect(serviceFor("hosEr", "tarMed")).toBe("Avsluta förvaring"));
  it("tomma svar ger ingen tjänst", () => expect(serviceFor("", "")).toBe("Okänd"));
});

describe("val utifrån bilens läge", () => {
  it("bil med förvarade däck kan välja alla fyra tjänsterna", () => {
    expect(tillChoicesFor(true)).toHaveLength(2);
    expect(availableServices(true).sort()).toEqual(
      ["Avsluta förvaring", "Nyförvaring", "Skifte", "Skifte och förvaring"],
    );
  });
  it("bil utan förvarade däck får bara Skifte eller Nyförvaring", () => {
    expect(tillChoicesFor(false).map((c) => c.id)).toEqual(["med"]);
    expect(availableServices(false)).toEqual(["Skifte", "Nyförvaring"]);
    expect(franChoicesFor(false)).toHaveLength(2);
  });
});

describe("priser", () => {
  it("varje tjänst har ett pris", () => {
    for (const s of ["Skifte", "Skifte och förvaring", "Nyförvaring", "Avsluta förvaring"]) {
      expect(priceFor(s as never)).toBeGreaterThan(0);
    }
    expect(Object.keys(PRICES)).toHaveLength(4);
  });
});

describe("register", () => {
  it("hittar bilen även med mellanslag och gemener", () => {
    expect(findDemoCar("abc 123")?.regnr).toBe("ABC123");
    expect(findDemoCar("XYZ999")).toBeUndefined();
  });
});

import { isBookable as _isBookable, endTimeFor as _endTimeFor } from "./booking-flow";
describe("kundbokning på servern", () => {
  const now = new Date(2026, 9, 26, 10, 0); // måndag 26 okt 10:00
  it("tid inom 48 timmar kan inte bokas", () => {
    expect(_isBookable("2026-10-28", "09:30", now, [])).toBe(false);
  });
  it("tid efter 48 timmar kan bokas", () => {
    expect(_isBookable("2026-10-28", "10:30", now, [])).toBe(true);
  });
  it("redan bokad tid kan inte bokas", () => {
    expect(_isBookable("2026-10-29", "10:30", now, ["10:30"])).toBe(false);
  });
  it("helgdag kan inte bokas", () => {
    expect(_isBookable("2026-10-31", "10:30", now, [])).toBe(false);
  });
  it("bokningen är 30 minuter", () => {
    expect(_endTimeFor("07:15")).toBe("07:45");
  });
});
