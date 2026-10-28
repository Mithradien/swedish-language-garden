import { describe, expect, it } from "vitest";
import { ARRIVAL_HISTORY_KEY, CSV_KEY, STATUS_KEY, findArrivalBookings, localDate, registerArrival, statusKey } from "./arrival";
import { parseBookingsCsv, type Booking } from "./bookings";

const now = new Date("2026-10-28T10:00:00");
const csv = 'First Name,Last Name,Date,Time,Custom Field Data\nTest,Kund,"28 oktober, 2026",10:00,"REG nr\nABC123"';
function setup() {
  const data = new Map<string, string>([[CSV_KEY, JSON.stringify({ text: csv })]]);
  const store = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
  const booking = parseBookingsCsv(csv)[0];
  if (!booking) throw new Error("Missing test booking");
  return { store, booking };
}
describe("ankomstregistrering", () => {
  it("matchar regnummer endast bland dagens bokningar", () => {
    const b: Booking = { regnr: "ABC123", date: "2026-10-28", start: "10:00", end: "10:30", dateLabel: "", name: "", phone: "", service: "Skifte" };
    expect(findArrivalBookings([b, { ...b, date: "2026-10-27" }], "abc 123", localDate(now), {})).toEqual([b]);
  });
  it("sparar grön ankomststatus och tidpunkt", () => {
    const { store, booking } = setup();
    expect(registerArrival(store, booking, now)).toBe("registered");
    expect(JSON.parse(store.getItem(STATUS_KEY) ?? "{}")[statusKey(booking)]).toBe("ankommen");
    expect(JSON.parse(store.getItem(ARRIVAL_HISTORY_KEY) ?? "[]")).toEqual([{ bookingKey: statusKey(booking), regnr: "ABC123", arrivedAt: now.toISOString() }]);
  });
  it("dubbelregistrering skapar inte en andra händelse", () => {
    const { store, booking } = setup();
    registerArrival(store, booking, now);
    expect(registerArrival(store, booking, now)).toBe("already");
    expect(JSON.parse(store.getItem(ARRIVAL_HISTORY_KEY) ?? "[]")).toHaveLength(1);
  });
  it("avbokade bilar kan inte registrera ankomst", () => {
    const { store, booking } = setup();
    const statuses = { [statusKey(booking)]: "avbokad" as const };
    store.setItem(STATUS_KEY, JSON.stringify(statuses));
    expect(findArrivalBookings([booking], "ABC123", localDate(now), statuses)).toEqual([]);
    expect(() => registerArrival(store, booking, now)).toThrow("avbokad");
    expect(store.getItem(ARRIVAL_HISTORY_KEY)).toBeNull();
  });
  it("en tidigare dags bokning kan inte registreras", () => {
    const { store, booking } = setup();
    expect(() => registerArrival(store, { ...booking, date: "2026-10-27" }, now)).toThrow("dagens bokning");
  });
  it("en borttagen bokning kan inte registreras", () => {
    const { store, booking } = setup();
    store.removeItem(CSV_KEY);
    expect(() => registerArrival(store, booking, now)).toThrow("inte längre");
  });
});