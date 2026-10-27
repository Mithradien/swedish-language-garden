import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Pencil, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PortalHeader } from "@/components/customer/customer-portal";
import { normalizeRegnr, type Service } from "@/lib/bookings";
import {
  BREAKS, DEMO_CARS, FRAN_CHOICES, TILL_CHOICES, availableServices, dayLabel, findDemoCar,
  franChoicesFor, longDayLabel, openDays, priceFor, serviceFor, slotsForDate, tillChoicesFor,
  type Choice, type DemoCar,
} from "@/lib/booking-flow";

export const Route = createFileRoute("/boka")({
  head: () => ({
    meta: [
      { title: "Boka tid – Däckhotell" },
      { name: "description", content: "Kundens bokningsflöde: ange regnummer, svara på två däckfrågor, välj dag och tid och bekräfta." },
      { property: "og:title", content: "Boka tid – Däckhotell" },
      { property: "og:description", content: "Boka däckskifte eller förvaring i några enkla steg." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Boka,
});

type Stage = "regnr" | "till" | "fran" | "tid" | "uppgifter" | "bekrafta" | "klar";

const GROUPS = ["Regnummer", "Dina däck", "Tid", "Uppgifter", "Klart"];
const GROUP_OF: Record<Stage, number> = {
  regnr: 0, till: 1, fran: 1, tid: 2, uppgifter: 3, bekrafta: 3, klar: 4,
};

const SVC_DOT: Record<Service, string> = {
  "Skifte": "bg-svc-skifte",
  "Skifte och förvaring": "bg-svc-forvaring",
  "Nyförvaring": "bg-svc-ny",
  "Avsluta förvaring": "bg-svc-avsluta",
  "Okänd": "bg-muted-foreground",
};

function Boka() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const [stage, setStage] = useState<Stage>("regnr");
  const [regnr, setRegnr] = useState("");
  const [car, setCar] = useState<DemoCar | null | undefined>(undefined);
  const [tillId, setTillId] = useState("");
  const [franId, setFranId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [namn, setNamn] = useState("");
  const [telefon, setTelefon] = useState("");
  const [epost, setEpost] = useState("");
  const [notering, setNotering] = useState("");
  const [error, setError] = useState("");

  // Okänt regnummer: båda svaren är möjliga. Känd bil utan däck: fråga 1 är redan besvarad.
  const hasStored = car ? car.harDack : true;
  const tillOptions = tillChoicesFor(hasStored);
  const franOptions = franChoicesFor(hasStored);
  const service = serviceFor(tillId, franId);
  const canBook = service !== "Okänd" && !!date && !!time;

  const days = useMemo(() => (now ? openDays(now, 10) : []), [now]);
  useEffect(() => {
    const first = days[0];
    if (!date && first) setDate(first);
  }, [days, date]);
  const activeDay = date || days[0] || "";
  const slots = useMemo(() => {
    if (!now || !activeDay) return [];
    const all = slotsForDate(activeDay, now).map((s) => s.time);
    const offset = Number(activeDay.slice(-2)) % all.length;
    const taken = all.filter((_, i) => (i + offset) % 5 === 2);
    return slotsForDate(activeDay, now, taken);
  }, [now, activeDay]);

  function submitRegnr(e: FormEvent) {
    e.preventDefault();
    const key = normalizeRegnr(regnr);
    if (key.length < 3) { setError("Ange ett regnummer med minst tre tecken."); return; }
    const found = findDemoCar(key);
    setRegnr(found ? found.regnr : key);
    setCar(found ?? null);
    setError("");
    if (found) {
      setNamn(found.namn); setTelefon(found.telefon); setEpost(found.epost);
    }
    if (found && !found.harDack) {
      setTillId("med");
      setStage("fran");
    } else {
      setStage("till");
    }
  }

  function goBack() {
    setError("");
    if (stage === "till") setStage("regnr");
    else if (stage === "fran") setStage(tillOptions.length > 1 ? "till" : "regnr");
    else if (stage === "tid") setStage("fran");
    else if (stage === "uppgifter") setStage("tid");
    else if (stage === "bekrafta") setStage("uppgifter");
  }

  const group = GROUP_OF[stage];

  return (
    <main className="min-h-screen">
      <PortalHeader />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <p className="mb-2 font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">Däckhotell</p>
        <h1 className="text-4xl font-bold uppercase sm:text-5xl">Boka tid</h1>

        <ol className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {GROUPS.map((g, i) => (
            <li key={g} className={`flex items-center gap-2 ${i === group ? "font-semibold" : "text-muted-foreground"}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${i < group ? "border-svc-forvaring bg-svc-forvaring text-primary-foreground" : i === group ? "border-primary" : "border-border"}`}>
                {i < group ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {g}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
          {stage !== "regnr" && (
            <Summary
              car={car} regnr={regnr} service={service} date={activeDay} time={time}
              telefon={telefon} epost={epost}
              onEdit={(s) => { setError(""); setStage(s); }}
            />
          )}

          <section className="min-w-0">
            {stage !== "regnr" && stage !== "klar" && (
              <button type="button" onClick={goBack} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Tillbaka
              </button>
            )}

            {stage === "regnr" && (
              <form onSubmit={submitRegnr} className="space-y-6">
                <h2 className="text-3xl font-semibold">Vad har du för regnummer?</h2>
                <Input
                  value={regnr}
                  onChange={(e) => setRegnr(e.target.value.toUpperCase())}
                  placeholder="T.ex. ABC123"
                  maxLength={12}
                  autoComplete="off"
                  className="h-16 w-full bg-card text-center font-display text-4xl font-bold uppercase tracking-[0.2em]"
                />
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="h-12 w-full font-display text-lg uppercase">
                  Nästa <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Hittar vi inte regnumret kan du boka ändå. I den här skissen finns
                  {" "}{DEMO_CARS.map((c) => c.regnr).join(", ")} och en bil som inte finns med.
                </p>
              </form>
            )}

            {stage === "till" && (
              <Question
                heading="Däcken du ska skifta till"
                sub="Var kommer däcken som ska monteras på bilen?"
                options={tillOptions}
                value={tillId}
                onPick={setTillId}
                onNext={() => setStage("fran")}
              />
            )}

            {stage === "fran" && (
              <Question
                heading="Däcken du skiftar från"
                sub="Vad händer med däcken som tas av bilen?"
                options={franOptions}
                value={franId}
                onPick={setFranId}
                onNext={() => setStage("tid")}
              />
            )}

            {stage === "tid" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold">Välj dag och tid</h2>
                {!now ? <p className="text-muted-foreground">Laddar schemat…</p> : (
                  <>
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                      {days.map((d) => (
                        <button
                          key={d} type="button" onClick={() => { setDate(d); setTime(""); }}
                          aria-pressed={d === activeDay}
                          className={`shrink-0 rounded-md border px-4 py-3 text-center font-display uppercase ${d === activeDay ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}
                        >
                          <span className="block text-xs opacity-80">{dayLabel(d).split(" ")[0]}</span>
                          <span className="block text-lg font-semibold">{dayLabel(d).split(" ").slice(1).join(" ")}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {slots.map((s) => (
                        <Fragment key={s.time}>
                          <button
                            type="button"
                            disabled={s.state !== "ledig"}
                            aria-pressed={time === s.time}
                            onClick={() => setTime(s.time)}
                            title={s.state === "upptagen" ? "Redan bokad" : s.state === "last" ? "Kan inte bokas" : "Ledig tid"}
                            className={`h-12 rounded-md border font-display text-lg tabular-nums ${
                              time === s.time
                                ? "border-primary bg-primary text-primary-foreground"
                                : s.state === "ledig"
                                  ? "bg-card hover:border-primary"
                                  : "border-dashed bg-muted text-muted-foreground line-through"
                            }`}
                          >
                            {s.time}
                          </button>
                          {BREAKS.filter((b) => b.after === s.time).map((b) => (
                            <div key={b.label} className="col-span-full flex items-center justify-center gap-3 rounded-md bg-muted px-3 py-2 font-display text-sm uppercase tracking-widest text-muted-foreground">
                              {b.label} <span className="tabular-nums normal-case tracking-normal">{b.time}</span>
                            </div>
                          ))}
                        </Fragment>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Överstrukna tider är upptagna eller låsta av personalen. Du kan boka tid tidligast 48 timmar fram i tiden.
                    </p>
                    <Button className="h-12 w-full font-display text-lg uppercase" disabled={!time} onClick={() => setStage("uppgifter")}>
                      Nästa <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {stage === "uppgifter" && (
              <form
                className="space-y-5"
                onSubmit={(e) => { e.preventDefault(); setStage("bekrafta"); }}
              >
                <h2 className="text-3xl font-semibold">Dina uppgifter</h2>
                <Field label="Namn" value={namn} onChange={setNamn} required autoComplete="name" />
                <Field label="Telefon" value={telefon} onChange={setTelefon} required type="tel" autoComplete="tel" />
                <Field label="E-post" value={epost} onChange={setEpost} required type="email" autoComplete="email" />
                <label className="block space-y-2 text-sm font-medium">
                  <span>Notering (valfritt)</span>
                  <Textarea
                    value={notering}
                    onChange={(e) => setNotering(e.target.value)}
                    placeholder="T.ex. nycklarna ligger i handskafacket"
                    className="bg-card"
                  />
                </label>
                <Button type="submit" className="h-12 w-full font-display text-lg uppercase">
                  Nästa <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            )}

            {stage === "bekrafta" && (
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold">Är allt rätt?</h2>
                <dl className="divide-y border-y">
                  <Row label="Regnummer" value={`${regnr}${car ? ` · ${car.modell}` : ""}`} />
                  <Row label="Tjänst" value={service} dot={SVC_DOT[service]} />
                  <Row label="Pris" value={`${priceFor(service)} kr`} />
                  <Row label="Dag" value={longDayLabel(activeDay)} />
                  <Row label="Tid" value={time} />
                  <Row label="Namn" value={namn} />
                  <Row label="Telefon" value={telefon} />
                  <Row label="E-post" value={epost} />
                  {notering && <Row label="Notering" value={notering} />}
                </dl>
                <Button
                  className="h-12 w-full font-display text-lg uppercase"
                  disabled={!canBook}
                  onClick={() => setStage("klar")}
                >
                  Boka tid <Check className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            {stage === "klar" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-svc-forvaring text-primary-foreground">
                    <Check className="h-7 w-7" />
                  </span>
                  <h2 className="text-3xl font-semibold">Tiden är bokad</h2>
                </div>
                <dl className="divide-y border-y">
                  <Row label="Regnummer" value={`${regnr}${car ? ` · ${car.modell}` : ""}`} />
                  <Row label="Tjänst" value={service} dot={SVC_DOT[service]} />
                  <Row label="Pris" value={`${priceFor(service)} kr`} />
                  <Row label="Dag" value={longDayLabel(activeDay)} />
                  <Row label="Tid" value={time} />
                  {car?.lagerplats && <Row label="Lagerplats" value={car.lagerplats} />}
                </dl>
                <p role="status" className="flex items-start gap-2 rounded-md border bg-secondary px-4 py-3 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  Detta är en layoutskiss. Ingen bokning har sparats och verkstaden har inte kontaktats.
                </p>
                <Button
                  variant="outline"
                  className="h-11 w-full font-display uppercase"
                  onClick={() => {
                    setStage("regnr"); setCar(undefined); setTillId(""); setFranId("");
                    setDate(""); setTime(""); setNotering(""); setRegnr(""); setError("");
                  }}
                >
                  Boka en till
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Question({ heading, sub, options, value, onPick, onNext }: {
  heading: string; sub: string; options: Choice[]; value: string; onPick: (id: string) => void; onNext: () => void;
}) {
  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (value) onNext(); }}>
      <div>
        <h2 className="text-3xl font-semibold">{heading}</h2>
        <p className="mt-1 text-muted-foreground">{sub}</p>
      </div>
      <div className="space-y-3">
        {options.map((o) => (
          <button
            key={o.id} type="button" onClick={() => onPick(o.id)} aria-pressed={value === o.id}
            className={`flex w-full items-center justify-between gap-4 rounded-md border-2 px-5 py-4 text-left transition ${value === o.id ? "border-primary bg-secondary" : "bg-card hover:border-primary"}`}
          >
            <span>
              <span className="block font-display text-xl uppercase">{o.label}</span>
              <span className="block text-sm text-muted-foreground">{o.hint}</span>
            </span>
            {value === o.id && <Check className="h-5 w-5 shrink-0" />}
          </button>
        ))}
      </div>
      <Button type="submit" className="h-12 w-full font-display text-lg uppercase" disabled={!value}>
        Nästa <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
}

function Summary({ car, regnr, service, date, time, telefon, onEdit }: {
  car: DemoCar | null | undefined; regnr: string; service: Service; date: string; time: string;
  telefon: string; epost: string; onEdit: (s: Stage) => void;
}) {
  return (
    <aside className="space-y-3 self-start rounded-md border bg-card p-5 lg:sticky lg:top-6">
      <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">Din bokning</h2>
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-2xl font-bold uppercase tracking-widest">{regnr || "—"}</span>
        <Edit onClick={() => onEdit("regnr")} />
      </div>
      {car ? (
        <p className="text-sm text-muted-foreground">{car.modell}{car.lagerplats ? ` · lagerplats ${car.lagerplats}` : ""}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Okänd bil för oss</p>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${SVC_DOT[service]}`} />
            {service === "Okänd" ? "Inte vald" : service}
          </span>
          <Edit onClick={() => onEdit(tillOptions.length > 1 ? "till" : "fran")} />
        </div>
        {service !== "Okänd" && <p className="mt-1 text-sm text-muted-foreground">{priceFor(service)} kr</p>}
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">{date && time ? `${dayLabel(date)} kl. ${time}` : "Ingen tid vald"}</span>
          <Edit onClick={() => onEdit("tid")} />
        </div>
      </div>
      {telefon && <p className="border-t pt-3 text-sm text-muted-foreground">{telefon}</p>}
    </aside>
  );
}

function Edit({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
      <Pencil className="h-3 w-3" /> Ändra
    </button>
  );
}

function Field({ label, value, onChange, ...rest }: {
  label: string; value: string; onChange: (v: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 bg-card" {...rest} />
    </label>
  );
}

function Row({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 text-right font-medium">
        {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
        {value}
      </dd>
    </div>
  );
}
