import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { mergeCard } from "./car-storage-sync";
import type { CarCard } from "./bookings";

const card = (p: Partial<CarCard>): CarCard => ({ regnr: "ABC123", modell: "", lagerplats: "", kundnr: "", owner: "", phone: "", email: "", minDepth: null, tires: [], ...p });

describe("mergeCard", () => {
  it("ny lagerplats uppdaterar befintlig bil", () =>
    expect(mergeCard(card({ lagerplats: "H21" }), card({ lagerplats: "M07" })).lagerplats).toBe("M07"));
  it("tomma fält i ny fil raderar inte sparade uppgifter", () => {
    const m = mergeCard(card({ phone: "0705", lagerplats: "H21", minDepth: 4, tires: [{ position: "VF", dimension: "", marke: "", typ: "", depth: 4, inland: "" }] }), card({}));
    expect(m.phone).toBe("0705");
    expect(m.lagerplats).toBe("H21");
    expect(m.minDepth).toBe(4);
    expect(m.tires).toHaveLength(1);
  });
});
