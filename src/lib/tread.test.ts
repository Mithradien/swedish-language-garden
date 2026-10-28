import { describe, expect, it } from "vitest";
import { tireSeason, treadColor } from "./tread";

describe("Sommardäck", () => {
  it("under 1.7 mm är rött", () => expect(treadColor(1.6, "summer")).toBe("red"));
  it("1.7 till 2.0 mm är orange", () => {
    expect(treadColor(1.7, "summer")).toBe("orange");
    expect(treadColor(2.0, "summer")).toBe("orange");
  });
  it("2.1 till 3.5 mm är gult", () => {
    expect(treadColor(2.1, "summer")).toBe("yellow");
    expect(treadColor(3.5, "summer")).toBe("yellow");
  });
  it("3.6 mm och uppåt är grönt", () => {
    expect(treadColor(3.6, "summer")).toBe("green");
    expect(treadColor(6, "summer")).toBe("green");
  });
});
describe("Vinterdäck", () => {
  it("under 3 mm är rött", () => expect(treadColor(2.9, "winter")).toBe("red"));
  it("3 till strax under 4 mm är orange", () => {
    expect(treadColor(3, "winter")).toBe("orange");
    expect(treadColor(3.9, "winter")).toBe("orange");
  });
  it("4 till och med 5 mm är gult", () => {
    expect(treadColor(4, "winter")).toBe("yellow");
    expect(treadColor(5, "winter")).toBe("yellow");
  });
  it("över 5 mm är grönt", () => expect(treadColor(5.1, "winter")).toBe("green"));
});
it("okänt djup eller däcktyp får ingen färg", () => {
  expect(treadColor(null, "summer")).toBe("unknown");
  expect(treadColor(NaN, "winter")).toBe("unknown");
  expect(treadColor(-1, "summer")).toBe("unknown");
  expect(treadColor(6, null)).toBe("unknown");
});
it("identifierar sommar och vinter utan att anta säsong för okänd typ", () => {
  expect(tireSeason("Vinterdäck · 225/45 R17")).toBe("winter");
  expect(tireSeason("Sommardäck")).toBe("summer");
  expect(tireSeason("")).toBeNull();
});