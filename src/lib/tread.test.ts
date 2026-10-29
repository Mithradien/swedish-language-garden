import { describe, expect, it } from "vitest";
import { tireSeason, treadColor } from "./tread";

describe("Sommardäck", () => {
  it("under 1,6 mm är rött", () => expect(treadColor(1.5, "summer")).toBe("red"));
  it("1,6 till 2,9 mm är orange", () => {
    expect(treadColor(1.6, "summer")).toBe("orange");
    expect(treadColor(2.9, "summer")).toBe("orange");
  });
  it("3,0 till 4,9 mm är gult", () => {
    expect(treadColor(3, "summer")).toBe("yellow");
    expect(treadColor(4.9, "summer")).toBe("yellow");
  });
  it("5,0 mm och uppåt är grönt", () => expect(treadColor(5, "summer")).toBe("green"));
});
describe("Vinterdäck", () => {
  it("under 3,0 mm är rött", () => expect(treadColor(2.9, "winter")).toBe("red"));
  it("3,0 till 3,9 mm är orange", () => {
    expect(treadColor(3, "winter")).toBe("orange");
    expect(treadColor(3.9, "winter")).toBe("orange");
  });
  it("4,0 till 5,9 mm är gult", () => {
    expect(treadColor(4, "winter")).toBe("yellow");
    expect(treadColor(5.9, "winter")).toBe("yellow");
  });
  it("6,0 mm och uppåt är grönt", () => expect(treadColor(6, "winter")).toBe("green"));
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

import { applyTread, TREAD_GUIDE } from "./tread";
describe("inställbara gränser", () => {
  it("nya sommargränser ändrar färg och text", () => {
    applyTread({ summer: { orangeFrom: 2, yellowFrom: 4, greenFrom: 6 }, winter: { orangeFrom: 3, yellowFrom: 4, greenFrom: 6 } });
    expect(treadColor(5, "summer")).toBe("yellow");
    expect(TREAD_GUIDE.summer[0]!.range).toBe("≥ 6,0 mm");
    applyTread(null);
    expect(treadColor(5, "summer")).toBe("green");
  });
  it("felaktig ordning avvisas och standard gäller", () => {
    applyTread({ summer: { orangeFrom: 5, yellowFrom: 4, greenFrom: 6 }, winter: { orangeFrom: 3, yellowFrom: 4, greenFrom: 6 } });
    expect(treadColor(1.5, "summer")).toBe("red");
    expect(treadColor(1.6, "summer")).toBe("orange");
  });
});
