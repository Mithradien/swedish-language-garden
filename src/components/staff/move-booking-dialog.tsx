import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { publicTakenTimes } from "@/lib/public-booking.functions";
import { canStaffMoveTo, slotsForDate } from "@/lib/booking-flow";
import { staffMoveBooking } from "@/lib/staff-booking.functions";
import { statusKey } from "@/lib/arrival";
import type { ScheduleRow } from "@/lib/bookings";

// Superadmin moves a booking to another free time, e.g. when a customer calls.
export function MoveBookingDialog({ booking, onClose, onMoved }: { booking: ScheduleRow; onClose: () => void; onMoved: () => void }) {
  const getTaken = useServerFn(publicTakenTimes);
  const move = useServerFn(staffMoveBooking);
  const [date, setDate] = useState(booking.date);
  const [taken, setTaken] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTime("");
    getTaken({ data: { date } }).then((r) => setTaken(r.taken.filter((t) => !(date === booking.date && t === booking.start)))).catch(() => setTaken([]));
  }, [date]);

  const times = slotsForDate(date, new Date(0), taken).map((s) => s.time);

  async function save() {
    setBusy(true);
    try {
      await move({ data: { key: statusKey(booking), date, time } });
      toast.success(`${booking.regnr} flyttad till ${date} ${time}`);
      onMoved(); onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte flytta bokningen");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flytta {booking.regnr}</DialogTitle>
          <DialogDescription>Nu: {booking.date} kl {booking.start}. Den gamla tiden noteras på bokningen.</DialogDescription>
        </DialogHeader>
        <label className="block text-sm font-medium">Ny dag<Input type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {times.map((t) => {
            const free = canStaffMoveTo(date, t, taken) && !(date === booking.date && t === booking.start);
            return <Button key={t} type="button" size="sm" variant={time === t ? "default" : "outline"} disabled={!free}
              className={!free ? "line-through" : ""} onClick={() => setTime(t)}>{t}</Button>;
          })}
        </div>
        {!times.length && <p className="text-sm text-muted-foreground">Verkstaden har stängt den dagen.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button disabled={!time || busy} onClick={save}>{busy ? "Flyttar…" : "Flytta bokningen"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
