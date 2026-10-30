# Ankomstsidan: låst regnummerruta och fungerande helskärm

## Vad som ändras
1. **Regnummerrutan går inte att trycka i.** Rutan blir en ren visningsyta (ser likadan ut som nu, stor skylt), så surfplattans eget tangentbord aldrig kommer upp. Inmatning sker bara med knapparna på sidan.
2. **Helskärmsknappen fungerar även på surfplattan.** Trycker man på knappen fyller ankomstsidan hela skärmen (toppmenyn döljs, sidan täcker allt), även när plattans webbläsare inte tillåter riktig helskärm. Där den tillåts används den dessutom. Samma knapp i hörnet tar en ut igen.
3. Om plattan själv lämnar helskärm (t.ex. svep) följer sidan med och visar knappen rätt.

Inga kontroller i webbläsaren görs, för att spara krediter.

## Tekniskt
- `src/routes/ankomst.tsx`: byt `<Input>` mot en `div` med `role="status"`/`aria-live` och samma klasser; ta bort fokus/onChange-logik och `input`-ref (knapparna uppdaterar redan `regnr`-state).
- `toggleKiosk`: prova `requestFullscreen` och `webkitRequestFullscreen` (och motsvarande exit); kioskläge sätts oberoende av resultatet.
- I kioskläge: `<main>` får `fixed inset-0 z-50 overflow-auto`, så sidan täcker allt även utan webbläsar-helskärm.
- Lyssna på `fullscreenchange`/`webkitfullscreenchange` för att hålla läget i synk.
