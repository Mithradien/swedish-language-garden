import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type CustomerAddress = { street: string; postalCode: string; city: string };

export function CustomerAddressForm({ initialAddress, onSave }: { initialAddress?: CustomerAddress | null; onSave: (address: CustomerAddress) => void }) {
  const [address, setAddress] = useState<CustomerAddress>(initialAddress ?? { street: "", postalCode: "", city: "" });
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(address);
    setSaved(true);
  }
  function change(key: keyof CustomerAddress, value: string) {
    setAddress(current => ({ ...current, [key]: value }));
    setSaved(false);
  }
  return <section className="mt-8 border-t pt-6">
    <h3 className="text-2xl font-semibold">Adress <span className="text-base font-normal text-muted-foreground">(valfritt)</span></h3>
    <form onSubmit={submit} className="mt-5 space-y-5">
      <label className="block space-y-2 text-sm font-medium"><span>Gatuadress</span><Input className="h-11 bg-card" autoComplete="street-address" name="street" value={address.street} onChange={event => change("street", event.target.value)} /></label>
      <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
        <label className="block space-y-2 text-sm font-medium"><span>Postnummer</span><Input className="h-11 bg-card" autoComplete="postal-code" name="postalCode" value={address.postalCode} onChange={event => change("postalCode", event.target.value)} /></label>
        <label className="block space-y-2 text-sm font-medium"><span>Ort</span><Input className="h-11 bg-card" autoComplete="address-level2" name="city" value={address.city} onChange={event => change("city", event.target.value)} /></label>
      </div>
      <Button type="submit" variant="outline" className="h-11"><Check/>Spara exempeladress</Button>
      {saved && <p role="status" className="text-sm text-muted-foreground">Exempeladressen har uppdaterats. Ingen adress har skickats eller sparats på servern.</p>}
    </form>
  </section>;
}