import { describe, expect, it } from "vitest";
import { buildWorkshopBoard, workshopDay, type BoardBooking } from "./workshop-board";

const booking: BoardBooking = { booking_key: "2026-10-29|09:00|ABC123", regnr: "ABC123", start_time: "09:00", service: "Skifte" };
const board = (arrival = "vantas", work = "ej_paborjad") => buildWorkshopBoard([booking], [{ booking_key: booking.booking_key, status: arrival }], [{ booking_key: booking.booking_key, status: work }], []);
describe("verkstadsskärmens flöde", () => {
  it("visar obearbetade bokningar som Väntas", () => expect(board()[0]?.stage).toBe("vantas"));
  it("visar registrerad ankomst som Ankommen", () => expect(board("ankommen")[0]?.stage).toBe("ankommen"));
  it("behåller sen ankomst i Ankommen", () => expect(board("sen")[0]).toMatchObject({ stage: "ankommen", arrival: "sen" }));
  it("visar påbörjat arbete som Pågående även efter ankomst", () => expect(board("ankommen", "paborjad")[0]?.stage).toBe("paborjad"));
  it("visar färdigt arbete som Klar", () => expect(board("ankommen", "klar")[0]?.stage).toBe("klar"));
  it("visar inte avbokade bilar även om arbete finns", () => expect(board("avbokad", "klar")).toEqual([]));
  it("markerar utebliven utan att flytta till Ankommen", () => expect(board("ej")[0]).toMatchObject({ stage: "vantas", arrival: "ej" }));
  it("hämtar lagerplats för exakt normaliserat regnummer", () => expect(buildWorkshopBoard([booking], [], [], [{ regnr: "abc 123", lagerplats: "A-12" }, { regnr: "ABC1234", lagerplats: "B-99" }])[0]?.lagerplats).toBe("A-12"));
  it("byter dag vid svensk midnatt", () => expect(workshopDay(new Date("2026-10-29T23:01:00Z"))).toBe("2026-10-30"));
});