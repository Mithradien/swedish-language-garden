import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { PRICE_LIST, PRICE_SERVICES, tierLabel } from "@/lib/prices";
import { parseTerms, type StorageTerms } from "@/lib/storage-terms";
import { tireSeason, treadColor } from "@/lib/tread";
import type { Tire } from "@/lib/bookings";
import { TREAD_STYLES } from "./tread-reading";

type Company = Omit<Settings, "logo" | "signal">;
export interface CertCar { regnr: string; modell: string; lagerplats: string; kundnr: string; tires: Tire[] }
export interface CertCustomer { name: string; email: string; phone: string; street: string; postalCode: string; city: string }

const POS: Record<string, string> = { VF: "Vänster fram", HF: "Höger fram", VB: "Vänster bak", HB: "Höger bak" };

function seasonLabel(tires: Tire[]) {
  const s = tireSeason(tires.map((t) => t.typ).join(" "));
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  if (s === "winter") return `Vinterhjul – förvaring ${m >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`}`;
  if (s === "summer") return `Sommarhjul – förvaring ${m >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`}`;
  return "Hjulförvaring";
}

/** Förvaringsbevis för en bil – visas på Mina sidor och kan skrivas ut eller sparas som PDF. */
export function StorageCertificate({ car, customer, open, onOpenChange }: { car: CertCar | null; customer: CertCustomer; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [company, setCompany] = useState<Company>(DEFAULT_SETTINGS);
  const [terms, setTerms] = useState<StorageTerms>(() => parseTerms(null));
  useEffect(() => {
    if (!open) return;
    supabase.from("app_config").select("key,value").in("key", ["company", "storage_terms"]).then(({ data }) => {
      const c = data?.find((r) => r.key === "company")?.value;
      if (c && typeof c === "object") setCompany({ ...DEFAULT_SETTINGS, ...(c as Partial<Company>) });
      setTerms(parseTerms(data?.find((r) => r.key === "storage_terms")?.value));
    });
  }, [open]);

  function print() {
    document.body.classList.add("printing-cert");
    const done = () => { document.body.classList.remove("printing-cert"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
  }

  if (!car) return null;
  const issued = new Date().toLocaleDateString("sv-SE");
  const address = [customer.street, [customer.postalCode, customer.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cert-dialog max-h-[90dvh] max-w-3xl overflow-y-auto">
        <DialogHeader className="screen-only">
          <DialogTitle className="text-3xl">Förvaringsbevis</DialogTitle>
          <DialogDescription>Skriv ut eller välj "Spara som PDF" i utskriftsrutan.</DialogDescription>
        </DialogHeader>
        <Button className="screen-only w-fit" onClick={print}><Printer />Skriv ut / spara PDF</Button>

        <article className="cert space-y-5 text-sm">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-foreground pb-3">
            <div>
              <p className="font-display text-2xl font-bold uppercase">Förvaringsbevis</p>
              <p className="text-muted-foreground">{seasonLabel(car.tires)} · Utfärdat {issued}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{company.company || "Verkstaden"}</p>
              {company.address && <p>{company.address}</p>}
              {(company.postalCode || company.city) && <p>{company.postalCode} {company.city}</p>}
              {company.phone && <p>Tel {company.phone}</p>}
              {company.email && <p>{company.email}</p>}
              {company.vatNr && <p>Momsreg.nr {company.vatNr}</p>}
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 font-display font-semibold uppercase">Kund</h3>
              <p>{customer.name || "—"}</p>
              {car.kundnr && <p>Kundnr {car.kundnr}</p>}
              {address && <p>{address}</p>}
              {customer.phone && <p>{customer.phone}</p>}
              {customer.email && <p>{customer.email}</p>}
            </div>
            <div>
              <h3 className="mb-1 font-display font-semibold uppercase">Bil & förvaring</h3>
              <p><span className="font-display text-lg font-bold tracking-widest">{car.regnr}</span>{car.modell ? ` · ${car.modell}` : ""}</p>
              <p>Lagerplats: <b>{car.lagerplats || "—"}</b></p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-display font-semibold uppercase">Hjul och mönsterdjup</h3>
            {car.tires.length ? (
              <table className="w-full border-collapse text-left">
                <thead><tr className="border-b"><th className="py-1">Position</th><th>Dimension</th><th>Fabrikat</th><th>Typ</th><th>Mönsterdjup</th></tr></thead>
                <tbody>
                  {car.tires.map((t, i) => {
                    const c = treadColor(t.depth, tireSeason(t.typ));
                    return (
                      <tr key={i} className="border-b">
                        <td className="py-1">{POS[t.position] ?? t.position}</td><td>{t.dimension || "—"}</td><td>{t.marke || "—"}</td><td>{t.typ || "—"}</td>
                        <td><span className={`rounded-sm border px-1.5 ${c !== "unknown" ? TREAD_STYLES[c] : ""}`}>{t.depth != null ? `${String(t.depth).replace(".", ",")} mm` : "—"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <p className="text-muted-foreground">Inga hjuluppgifter registrerade ännu.</p>}
          </section>

          <section>
            <h3 className="mb-1 font-display font-semibold uppercase">Försäkring och ansvar</h3>
            <p className="whitespace-pre-line">{terms.insurance}</p>
          </section>

          <section>
            <h3 className="mb-1 font-display font-semibold uppercase">Särskilda villkor</h3>
            <ul className="list-disc space-y-0.5 pl-5">{terms.special.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>

          <section>
            <h3 className="mb-1 font-display font-semibold uppercase">Gällande prislista</h3>
            <table className="w-full border-collapse text-left">
              <tbody>
                {PRICE_SERVICES.map((s) => (PRICE_LIST[s] ?? []).map((t, i, all) => (
                  <tr key={`${s}-${i}`} className="border-b"><td className="py-1">{i === 0 ? s : ""}</td><td>{tierLabel(all, i)}</td><td className="text-right">{t.price} kr</td></tr>
                )))}
              </tbody>
            </table>
          </section>
        </article>
      </DialogContent>
    </Dialog>
  );
}
