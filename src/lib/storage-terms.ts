/** Förslag på texter till förvaringsbeviset – verkstaden ska ersätta dem med sina egna. */
export const DEFAULT_INSURANCE_TEXT =
  "Hjulen förvaras i låst och larmat utrymme. Verkstadens ansvarsförsäkring gäller vid brand, inbrott och vattenskada i lokalen. " +
  "Skador som uppstår av normalt åldrande eller dolda fel på däck och fälgar ersätts inte. Vi rekommenderar att du kontrollerar att din egen bil- eller hemförsäkring omfattar hjul som förvaras utanför hemmet.";

export const DEFAULT_SPECIAL_TERMS = [
  "Förvaringen gäller en säsong i taget och förlängs automatiskt vid nästa skifte.",
  "Hjul hämtas eller skiftas efter bokad tid. Avbokning ska ske senast 48 timmar innan.",
  "Hjul som inte hämtats eller förnyats inom 12 månader efter säsongens slut kan, efter påminnelse, skrotas eller säljas för att täcka förvaringskostnaden.",
  "Uppmätta mönsterdjup gäller vid inlämningstillfället.",
];

export interface StorageTerms { insurance: string; special: string[] }
export function parseTerms(v: unknown): StorageTerms {
  const o = (v ?? {}) as Partial<StorageTerms>;
  return {
    insurance: typeof o.insurance === "string" && o.insurance.trim() ? o.insurance : DEFAULT_INSURANCE_TEXT,
    special: Array.isArray(o.special) && o.special.length ? o.special.filter((s): s is string => typeof s === "string") : DEFAULT_SPECIAL_TERMS,
  };
}
