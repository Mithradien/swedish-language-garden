import { afterEach, describe, expect, it } from "vitest";
import { applySchedule, validSchedule } from "./bookings";
import { scheduleTimes } from "./booking-flow";

afterEach(() => applySchedule(null));
describe("bokningsschema", () => {
  it("standard ger 27 tider", () => expect(scheduleTimes()).toHaveLength(27));
  it("eget schema byter tiderna", () => {
    applySchedule({ passes: [[480, 540]], step: 30 });
    expect(scheduleTimes()).toEqual(["08:00", "08:30", "09:00"]);
  });
  it("sista tid före första avvisas", () => expect(validSchedule({ passes: [[600, 500]], step: 15 })).toBeNull());
});
