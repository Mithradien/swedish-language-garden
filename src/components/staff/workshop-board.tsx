import { useEffect, useState } from "react";
import { Ban, CheckCheck, Clock3, Expand, LogIn, MapPin, Minimize, RefreshCw, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/top-nav";
import { useSettings } from "@/lib/settings";
import { BOARD_STAGES, buildWorkshopBoard, hideCollected, workshopDay, type BoardCar } from "@/lib/workshop-board";
import { parseScreenSettings, receptionCars, screenColumn } from "@/lib/screen-settings";

const STAGES = {
  vantas: { label: "Väntas", icon: Clock3, color: "border-muted-foreground", badge: "bg-muted text-muted-foreground" },
  ankommen: { label: "Ankommen", icon: LogIn, color: "border-st-arrived", badge: "bg-st-arrived text-foreground" },
  paborjad: { label: "Pågående", icon: Wrench, color: "border-svc-skifte", badge: "bg-svc-skifte/15 text-foreground" },
  avbruten: { label: "Avbruten", icon: Ban, color: "border-destructive", badge: "bg-destructive/15 text-foreground" },
  klar: { label: "Klar", icon: CheckCheck, color: "border-tread-green", badge: "bg-tread-green/15 text-foreground" },
};

export function WorkshopBoard({ audience = "workshop" }: { audience?: "workshop" | "reception" }) {
  const reception = audience === "reception";
  const [now, setNow] = useState<Date | null>(null);
  const [cars, setCars] = useState<BoardCar[]>([]);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [screen, setScreen] = useState(() => parseScreenSettings(null));
  const { settings } = useSettings();
  const date = now ? workshopDay(now) : "";

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => { window.clearInterval(timer); document.removeEventListener("fullscreenchange", sync); };
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("app_config").select("value").eq("key", "screens").maybeSingle();
      if (active && !error) setScreen(parseScreenSettings(data?.value));
    };
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [reception]);

  useEffect(() => {
    if (!date) return;
    let active = true;
    let busy = false;
    setCars([]); setUpdated(null); setError("");
    async function load() {
      if (busy) return;
      busy = true;
      try {
        const [bookings, orders] = await Promise.all([
          supabase.from("bookings").select("booking_key,regnr,start_time,service").eq("booking_date", date).order("start_time"),
          supabase.from("work_orders").select("booking_key,status,finished_at").eq("booking_date", date),
        ]);
        if (bookings.error || orders.error) throw new Error("read");
        const rows = bookings.data ?? [];
        const [statuses, storage] = rows.length ? await Promise.all([
          supabase.from("booking_statuses").select("booking_key,status").in("booking_key", rows.map(b => b.booking_key)),
          reception ? Promise.resolve({ data: [], error: null }) : supabase.from("car_storage").select("regnr,lagerplats").in("regnr", [...new Set(rows.map(b => b.regnr))]),
        ]) : [{ data: [], error: null }, { data: [], error: null }];
        if (statuses.error || storage.error) throw new Error("read");
        if (active) { setCars(buildWorkshopBoard(rows, statuses.data ?? [], orders.data ?? [], storage.data ?? [])); setUpdated(new Date()); setError(""); }
      } catch {
        if (active) setError("Anslutningen är bruten. Försöker igen…");
      } finally { busy = false; }
    }
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, reception ? screen.interval * 1000 : 10000);
    const refresh = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("online", refresh); };
  }, [date, retry, reception, screen.interval]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setError("Helskärm kunde inte öppnas i denna webbläsare."); }
  }

  const shown = now ? hideCollected(cars, screen.hideAfter, now) : cars;
  const displayed = reception && now ? receptionCars(shown, screen, now) : shown;
  const stages = BOARD_STAGES.filter(stage => !reception || screen.columns[stage].visible);
  const grid = stages.length === 1 ? "lg:grid-cols-1" : stages.length === 2 ? "lg:grid-cols-2" : stages.length === 3 ? "lg:grid-cols-3" : stages.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-5";
  return <main className="min-h-screen bg-background">
    {!fullscreen && <div className="bg-primary text-primary-foreground"><TopNav hideAccount={reception} /></div>}
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex min-w-0 items-center gap-4">
          {settings.logo && <img src={settings.logo} alt={settings.company || "Verkstadens logotyp"} className="h-14 w-20 object-contain" />}
          <div><h1 className="break-words text-4xl font-bold tracking-normal">{reception ? screen.title : "Verkstadsskärm"}</h1>{settings.company && <p className="text-muted-foreground">{settings.company}</p>}</div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="text-right"><p className="text-base capitalize">{now?.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm", weekday: "long", day: "numeric", month: "long" }) ?? "—"}</p><p className="font-display text-4xl font-bold tabular-nums">{now?.toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", minute: "2-digit" }) ?? "—"}</p></div>
          <Button variant="outline" size="icon" className="h-12 w-12" title={fullscreen ? "Lämna helskärm" : "Helskärm"} aria-label={fullscreen ? "Lämna helskärm" : "Helskärm"} onClick={toggleFullscreen}>{fullscreen ? <Minimize /> : <Expand />}</Button>
        </div>
      </header>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-medium">{reception ? stages.reduce((n, stage) => n + screenColumn(displayed, stage, screen).length, 0) : shown.length} {reception ? "visade bokningar" : "bokningar idag"}</p>
        <div className="flex items-center gap-3"><p role="status" className={error ? "text-destructive" : "text-muted-foreground"}>{error || (updated ? `Uppdaterad ${updated.toLocaleTimeString("sv-SE", { timeZone: "Europe/Stockholm" })}` : "Hämtar dagens bokningar…")}</p>{error && <Button variant="outline" size="icon" aria-label="Försök igen" title="Försök igen" onClick={() => setRetry(v => v + 1)}><RefreshCw /></Button>}</div>
      </div>
      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${grid}`}>
        {stages.map(stage => {
          const meta = STAGES[stage]; const Icon = meta.icon; const list = reception ? screenColumn(displayed, stage, screen) : shown.filter(c => c.stage === stage);
          const label = reception ? screen.columns[stage].label : meta.label;
          return <section key={stage} aria-label={label} className="min-w-0">
            <div className={`mb-4 flex items-center justify-between gap-2 border-t-4 pt-4 ${meta.color}`}><h2 className="flex min-w-0 items-center gap-2 text-3xl font-bold tracking-normal"><Icon className="h-6 w-6 shrink-0" /><span className="break-words">{label}</span></h2><span className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded px-2 text-lg font-bold tabular-nums ${meta.badge}`}>{list.length}</span></div>
            <ul className="space-y-3">{list.map(car => <li key={car.booking_key} className={`rounded-md border border-l-4 bg-card p-4 text-card-foreground ${meta.color}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-display text-3xl font-bold break-all">{car.regnr}</span><span className="text-xl font-semibold tabular-nums">{car.start_time}</span></div>
              {!reception && <>
                <p className="mt-2 break-words text-lg">{car.service || "Ej angiven tjänst"}</p>
                <p className="mt-4 flex items-center gap-2 text-base text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /><span className="break-all">{car.lagerplats || "Ingen lagerplats"}</span></p>
                {car.arrival === "sen" && stage === "ankommen" && <p className="mt-3 rounded bg-st-late px-2 py-1 text-sm font-semibold text-foreground">Sen ankomst</p>}
                {car.arrival === "ej" && stage === "vantas" && <p className="mt-3 rounded bg-st-noshow px-2 py-1 text-sm font-semibold text-foreground">Ej ankommen</p>}
              </>}
            </li>)}</ul>
            {!list.length && <p className="border-t py-6 text-muted-foreground">Inga bilar</p>}
          </section>;
        })}
      </div>
    </div>
  </main>;
}