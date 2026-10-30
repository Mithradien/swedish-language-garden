import { describe, expect, it } from "vitest";
import { buildWorkshopBoard, hideCollected } from "./workshop-board";
const b = { booking_key: "k", regnr: "ABC123", start_time: "10:00", service: "Skifte" };
describe("hämtade bilar", () => {
  it("hämtad bil visas inte", () => { expect(buildWorkshopBoard([b], [], [{ booking_key: "k", status: "hamtad" }], [])).toHaveLength(0); });
  it("avbruten får egen kolumn", () => { expect(buildWorkshopBoard([b], [], [{ booking_key: "k", status: "avbruten" }], [])[0]?.stage).toBe("avbruten"); });
  it("klar bil döljs efter 30 minuter", () => {
    const cars = buildWorkshopBoard([b], [], [{ booking_key: "k", status: "klar", finished_at: "2026-10-30T09:00:00Z" }], []);
    expect(hideCollected(cars, 30, new Date("2026-10-30T09:29:00Z"))).toHaveLength(1);
    expect(hideCollected(cars, 30, new Date("2026-10-30T09:31:00Z"))).toHaveLength(0);
    expect(hideCollected(cars, 0, new Date("2026-10-30T12:00:00Z"))).toHaveLength(1);
  });
});
