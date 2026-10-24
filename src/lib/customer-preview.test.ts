import { describe, expect, it } from "vitest";
import { EXAMPLE_CUSTOMER, EXAMPLE_SCHEDULE, exampleVehicles, previewSlots, requestPreviewVehicle, updatePreviewAppointment, visiblePreviewVehicles, type PreviewAppointment } from "./customer-preview";
const booked: PreviewAppointment = { id: "booking", customerId: EXAMPLE_CUSTOMER, vehicleId: "car-1", date: "2026-10-26", time: "09:00", service: "Skifte", status: "Bokad" };

describe("Customer preview rules (not server authorization)", () => {
  it("exposes only the customer's approved vehicles", () => {
    const other = { ...exampleVehicles()[0], id: "other", ownerId: "someone-else", regnr: "XYZ789" };
    const vehicles = exampleVehicles();
    if (other.tread !== undefined && other.model !== undefined) vehicles.push(other as typeof vehicles[number]);
    expect(visiblePreviewVehicles(vehicles, EXAMPLE_CUSTOMER).map(v => v.regnr)).toEqual(["ABC123"]);
  });
  it("new registration requests are not automatically approved", () => {
    const result = requestPreviewVehicle(exampleVehicles(), "ghi 789", EXAMPLE_CUSTOMER);
    expect(result.at(-1)?.regnr).toBe("GHI789");
    expect(result.at(-1)?.approved).toBe(false);
    expect(visiblePreviewVehicles(result, EXAMPLE_CUSTOMER).map(v => v.regnr)).not.toContain("GHI789");
  });
  it("has no bookable times without configured opening hours", () => expect(previewSlots("2026-10-26", null, [])).toEqual([]));
  it("cannot book an unapproved car", () => expect(() => updatePreviewAppointment([], exampleVehicles(), EXAMPLE_CUSTOMER, { ...booked, vehicleId: "car-2" }, EXAMPLE_SCHEDULE)).toThrow("godkännas"));
  it("a full slot is unavailable", () => expect(previewSlots("2026-10-26", EXAMPLE_SCHEDULE, [booked])).not.toContain("09:00"));
  it("failed rescheduling leaves the old booking unchanged", () => {
    const list = [booked, { ...booked, id: "occupied", time: "10:00" }];
    expect(() => updatePreviewAppointment(list, exampleVehicles(), EXAMPLE_CUSTOMER, { ...booked, time: "10:00" }, EXAMPLE_SCHEDULE)).toThrow("inte längre ledig");
    expect(list.find(a => a.id === "booking")?.time).toBe("09:00");
  });
  it("successful rescheduling replaces the old time", () => {
    const list = updatePreviewAppointment([booked], exampleVehicles(), EXAMPLE_CUSTOMER, { ...booked, time: "11:00" }, EXAMPLE_SCHEDULE);
    expect(list).toHaveLength(1);
    expect(list[0]?.time).toBe("11:00");
  });
  it("does not reschedule another customer's booking", () => expect(() => updatePreviewAppointment([{ ...booked, customerId: "someone-else" }], exampleVehicles(), EXAMPLE_CUSTOMER, booked, EXAMPLE_SCHEDULE)).toThrow("kan inte ändras"));
});
