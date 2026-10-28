import { addDays, format, parseISO } from "date-fns";
import { normalizeRegnr, type Service } from "./bookings";

// These are illustrative browser-only records, never authentication or storage.
export interface PreviewVehicle {
  id: string;
  ownerId: string;
  regnr: string;
  model: string;
  approved: boolean;
  tread: [number, number, number, number] | null;
  dot: string;
  tire: string;
}
export interface PreviewAppointment {
  id: string;
  customerId: string;
  vehicleId: string;
  date: string;
  time: string;
  service: Exclude<Service, "Okänd">;
  status: "Bokad" | "Klar" | "Avbokad";
}
export interface PreviewSchedule {
  weekdays: number[];
  start: string;
  end: string;
  minutes: number;
  capacity: number;
  closedDates: string[];
}
export const EXAMPLE_CUSTOMER = "example-customer";
export const EXAMPLE_SCHEDULE: PreviewSchedule = {
  weekdays: [1, 2, 3, 4, 5], start: "08:00", end: "16:00", minutes: 30,
  capacity: 1, closedDates: [],
};
export function exampleVehicles(): PreviewVehicle[] {
  return [
    { id: "car-1", ownerId: EXAMPLE_CUSTOMER, regnr: "ABC123", model: "Volvo V60", approved: true, tread: [2.5, 3.5, 4.5, 6.2], dot: "2324", tire: "Vinterdäck · 225/45 R17" },
    { id: "car-2", ownerId: EXAMPLE_CUSTOMER, regnr: "DEF456", model: "Volkswagen Golf", approved: false, tread: null, dot: "", tire: "" },
  ];
}
export function exampleDate(): string {
  let date = addDays(new Date(), 3);
  while ([0, 6].includes(date.getDay())) date = addDays(date, 1);
  return format(date, "yyyy-MM-dd");
}
export function displayDate(date: string): string {
  return parseISO(date).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
}
function minutes(time: string): number {
  const [h = "", m = ""] = time.split(":");
  return Number(h) * 60 + Number(m);
}
export function previewSlots(date: string, schedule: PreviewSchedule | null, appointments: PreviewAppointment[], excludingId?: string): string[] {
  if (!schedule || !date || !schedule.weekdays.includes(parseISO(date).getDay()) || schedule.closedDates.includes(date)) return [];
  const start = minutes(schedule.start), end = minutes(schedule.end);
  if (!Number.isInteger(schedule.minutes) || schedule.minutes < 5 || schedule.capacity < 1 || !Number.isFinite(start) || !Number.isFinite(end)) return [];
  const slots: string[] = [];
  for (let t = start; t + schedule.minutes <= end; t += schedule.minutes) {
    const time = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    const used = appointments.filter(a => a.id !== excludingId && a.date === date && a.time === time && a.status === "Bokad").length;
    if (used < schedule.capacity) slots.push(time);
  }
  return slots;
}
export function visiblePreviewVehicles(vehicles: PreviewVehicle[], customerId: string): PreviewVehicle[] {
  return vehicles.filter(v => v.ownerId === customerId && v.approved);
}
export function requestPreviewVehicle(vehicles: PreviewVehicle[], rawRegnr: string, customerId: string): PreviewVehicle[] {
  const regnr = normalizeRegnr(rawRegnr);
  if (!/^[A-Z0-9]{3,10}$/.test(regnr)) throw new Error("Ange ett giltigt regnummer.");
  if (vehicles.some(v => v.ownerId === customerId && v.regnr === regnr)) throw new Error("Regnumret finns redan bland dina bilar eller förfrågningar.");
  return [...vehicles, { id: `request-${regnr}`, ownerId: customerId, regnr, model: "Bil", approved: false, tread: null, dot: "", tire: "" }];
}
export function updatePreviewAppointment(
  appointments: PreviewAppointment[], vehicles: PreviewVehicle[], customerId: string,
  requested: PreviewAppointment, schedule: PreviewSchedule | null,
): PreviewAppointment[] {
  const current = appointments.find(a => a.id === requested.id);
  if (current && (current.customerId !== customerId || current.status !== "Bokad")) throw new Error("Bokningen kan inte ändras.");
  if (requested.customerId !== customerId || !visiblePreviewVehicles(vehicles, customerId).some(v => v.id === requested.vehicleId)) throw new Error("Bilen måste först godkännas och tillhöra ditt konto.");
  if (!previewSlots(requested.date, schedule, appointments, requested.id).includes(requested.time)) throw new Error("Tiden är inte längre ledig. Välj en annan tid.");
  return [...appointments.filter(a => a.id !== requested.id), { ...requested, status: "Bokad" }];
}
