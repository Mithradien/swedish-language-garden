import { useState } from "react";
import { depthChange, previousTyreVisit, type TyreVisit } from "@/lib/tyre-history";
import { TreadReading } from "./tread-reading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WHEELS = [["depth_vf","Vänster fram"],["depth_hf","Höger fram"],["depth_vb","Vänster bak"],["depth_hb","Höger bak"]] as const;
export function TyreHistory({ visits }: { visits: TyreVisit[] }) {
  const [regnr,setRegnr]=useState("all");
  const cars=[...new Set(visits.map(v=>v.regnr))];
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-3xl font-semibold">Skifteshistorik</h2>{cars.length > 1 && <Select value={regnr} onValueChange={setRegnr}><SelectTrigger aria-label="Välj bil i skifteshistoriken" className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alla bilar</SelectItem>{cars.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>}</div>
    {!visits.length && <p className="border-y py-8 text-muted-foreground">Inga genomförda skiften finns registrerade.</p>}
    {visits.filter(v=>regnr==="all"||v.regnr===regnr).map(v=> {
      const previous=previousTyreVisit(v,visits);
      const season=v.tire_season==="winter"?"Vinterdäck":v.tire_season==="summer"?"Sommardäck":"Säsong ej registrerad";
      return <article key={v.id} className="border-t pt-5">
        <div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-2xl font-semibold">{v.regnr} · {season}</h3><p className="mt-1 text-muted-foreground">{v.fitted_tire_set || "Däckuppgifter saknas för detta besök"}</p></div><div className="text-sm"><p>{new Date(v.finished_at || `${v.booking_date}T12:00:00`).toLocaleDateString("sv-SE",{timeZone:"Europe/Stockholm",day:"numeric",month:"long",year:"numeric"})}</p><p className="mt-1 text-tread-green">Genomfört · {v.service}</p></div></div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">{WHEELS.map(([key,label])=> {
          const delta=previous?depthChange(v[key],previous[key]):null;
          return <div key={key} className="min-w-0 border-l pl-3"><p className="text-sm font-medium">{label}</p><TreadReading depth={v[key]} tire={v.tire_season?season:""}/>{delta!=null && <p className="mt-2 text-sm text-muted-foreground">{delta>0?"+":""}{delta.toLocaleString("sv-SE")} mm sedan {previous?.booking_date.slice(0,4)}</p>}</div>;
        })}</div>
      </article>;
    })}
  </section>;
}