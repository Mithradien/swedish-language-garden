import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Check, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { renewalSeasonLabel } from "@/lib/storage-renewal";

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9ÅÄÖ]/g, "");
type Car = { regnr: string; modell: string; lagerplats: string; owner: string };
type Photo = { id: string; path: string; caption: string; created_at: string; url?: string | undefined };
type Handover = { id: string; lagerplats: string; received_by: string; note: string; created_at: string };
const fmt = (d: string) => new Date(d).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });

/** Personalens verktyg per bil: lagerplats, intern anteckning, bilder och kvittens av utlämnade hjul. */
export function CarTools() {
  const [query, setQuery] = useState("");
  const [regnr, setRegnr] = useState("");
  return (
    <section className="mb-10 space-y-5 rounded-md border bg-card p-5">
      <h2 className="text-2xl font-semibold">Verktyg för kundbilar</h2>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setRegnr(clean(query)); }}>
        <Input value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} placeholder="Regnummer, t.ex. ABC123" className="max-w-xs font-mono uppercase" />
        <Button type="submit" disabled={clean(query).length < 2}><Search className="mr-1 h-4 w-4" />Öppna bil</Button>
      </form>
      {regnr && <CarPanel key={regnr} regnr={regnr} />}
    </section>
  );
}

function CarPanel({ regnr }: { regnr: string }) {
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null | undefined>(undefined);
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [renewals, setRenewals] = useState<{ id: string; season: string; accepted_name: string; accepted_at: string }[]>([]);
  const [renewalError, setRenewalError] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = (t: string) => { setFlash(t); setTimeout(() => setFlash(""), 3000); };

  async function loadPhotos() {
    const { data } = await supabase.from("car_photos").select("id,path,caption,created_at").eq("regnr", regnr).order("created_at", { ascending: false });
    const rows = data ?? [];
    const { data: signed } = rows.length ? await supabase.storage.from("car-photos").createSignedUrls(rows.map((r) => r.path), 3600) : { data: [] };
    setPhotos(rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? undefined })));
  }
  async function loadHandovers() {
    const { data } = await supabase.from("wheel_handovers").select("id,lagerplats,received_by,note,created_at").eq("regnr", regnr).order("created_at", { ascending: false });
    setHandovers(data ?? []);
  }

  useEffect(() => {
    void supabase.from("car_storage").select("regnr,modell,lagerplats,owner").eq("regnr", regnr).maybeSingle().then(({ data }) => { setCar(data); setPlace(data?.lagerplats ?? ""); });
    void supabase.from("car_notes").select("note").eq("regnr", regnr).maybeSingle().then(({ data }) => { setNote(data?.note ?? ""); setSavedNote(data?.note ?? ""); });
    void loadPhotos(); void loadHandovers();
    void supabase.from("storage_renewals").select("id,season,accepted_name,accepted_at").eq("regnr", regnr).order("accepted_at", { ascending: false }).then(({ data, error }) => { setRenewals(data ?? []); if (error) setRenewalError("Förnyelserna kunde inte hämtas."); });
  }, [regnr]);

  async function savePlace() {
    setBusy(true);
    const row = { regnr, lagerplats: place.trim(), updated_at: new Date().toISOString() };
    const { error } = car ? await supabase.from("car_storage").update(row).eq("regnr", regnr) : await supabase.from("car_storage").insert(row);
    setBusy(false);
    if (error) return ok("Kunde inte spara lagerplatsen.");
    setCar((c) => ({ regnr, modell: c?.modell ?? "", owner: c?.owner ?? "", lagerplats: place.trim() }));
    ok("Lagerplatsen är sparad");
  }

  async function saveNote() {
    setBusy(true);
    const { error } = await supabase.from("car_notes").upsert({ regnr, note, updated_by: user?.id ?? null, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return ok("Kunde inte spara anteckningen.");
    setSavedNote(note); ok("Anteckningen är sparad");
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length || !user) return;
    setBusy(true);
    for (const f of files) {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${regnr}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("car-photos").upload(path, f, { contentType: f.type || "image/jpeg" });
      if (!error) await supabase.from("car_photos").insert({ regnr, path, uploaded_by: user.id });
    }
    setBusy(false);
    await loadPhotos(); ok("Bilderna är uppladdade");
  }

  async function removePhoto(p: Photo) {
    if (!confirm("Ta bort bilden?")) return;
    await supabase.storage.from("car-photos").remove([p.path]);
    await supabase.from("car_photos").delete().eq("id", p.id);
    await loadPhotos();
  }

  async function handover(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const received = String(fd.get("received") ?? "").trim();
    if (!received || !user) return;
    setBusy(true);
    const form = e.currentTarget;
    const { error } = await supabase.from("wheel_handovers").insert({ regnr, lagerplats: car?.lagerplats ?? "", received_by: received, note: String(fd.get("note") ?? "").trim(), handed_by: user.id });
    setBusy(false);
    if (error) return ok("Kunde inte spara kvittensen.");
    form.reset(); await loadHandovers(); ok("Utlämningen är kvitterad");
  }

  if (car === undefined) return <p className="text-sm text-muted-foreground">Laddar…</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="rounded-md border-2 border-foreground px-3 py-1 font-mono text-xl font-bold">{regnr}</span>
        <span className="text-muted-foreground">{car ? [car.modell, car.owner].filter(Boolean).join(" · ") || "Bil i förvaringen" : "Bilen finns inte i förvaringen än"}</span>
        {flash && <span className="flex items-center gap-1 rounded-md bg-st-arrived px-2 py-1 text-sm font-medium text-foreground"><Check className="h-4 w-4" />{flash}</span>}
      </div>

      <section className="space-y-2 border-y py-4">
        <h3 className="font-semibold">Förnyelse av förvaring</h3>
        {renewalError ? <p role="alert" className="text-sm text-destructive">{renewalError}</p> : renewals.length ? <ul className="divide-y text-sm">{renewals.map(r => <li key={r.id} className="py-2"><b>{renewalSeasonLabel(r.season)}</b> · Godkänd av {r.accepted_name} · {fmt(r.accepted_at)}</li>)}</ul> : <p className="text-sm text-muted-foreground">Ingen ny förvaringssäsong godkänd via Mina sidor.</p>}
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 rounded-md border p-4">
          <h3 className="font-semibold">Lagerplats</h3>
          <div className="flex gap-2">
            <Input value={place} onChange={(e) => setPlace(e.target.value.toUpperCase())} placeholder="t.ex. A-12-3" className="font-mono" />
            <Button onClick={savePlace} disabled={busy || place.trim() === (car?.lagerplats ?? "")}>Spara</Button>
          </div>
          <p className="text-xs text-muted-foreground">Tom ruta betyder att hjulen inte finns i förvaringen.</p>
        </div>

        <div className="space-y-2 rounded-md border p-4">
          <h3 className="font-semibold">Intern anteckning <span className="text-xs font-normal text-muted-foreground">(syns bara för personal)</span></h3>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="t.ex. Låsbult i handskfacket" maxLength={2000} />
          <Button size="sm" onClick={saveNote} disabled={busy || note === savedNote}>Spara anteckning</Button>
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Bilder på däck och skador</h3>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Camera className="h-4 w-4" />Ta bild / ladda upp
            <input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={upload} disabled={busy} />
          </label>
        </div>
        {photos.length === 0 ? <p className="text-sm text-muted-foreground">Inga bilder än.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => (
              <figure key={p.id} className="relative overflow-hidden rounded-md border">
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt={`Bild ${regnr}`} className="aspect-square w-full object-cover" /></a> : <div className="aspect-square bg-muted" />}
                <figcaption className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">{fmt(p.created_at)}
                  <button type="button" aria-label="Ta bort bild" onClick={() => void removePhoto(p)}><Trash2 className="h-4 w-4" /></button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <h3 className="font-semibold">Kvittera utlämnade hjul</h3>
        <form onSubmit={handover} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input name="received" placeholder="Hämtades av (namn)" required maxLength={100} />
          <Input name="note" placeholder="Kommentar (valfritt)" maxLength={500} />
          <Button type="submit" disabled={busy}>Kvittera</Button>
        </form>
        {handovers.length > 0 && (
          <ul className="divide-y text-sm">
            {handovers.map((h) => <li key={h.id} className="py-2"><b>{fmt(h.created_at)}</b> – hämtades av {h.received_by}{h.lagerplats && ` (från ${h.lagerplats})`}{h.note && ` · ${h.note}`}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
