# Kundbokning: egen server krävs före skarp drift

## Status

`/kund` och `/personal` är uttryckligen märkta förhandsvisningar. Inga konton skapas,
uppgifter skickas, bokningar sparas eller bilder laddas upp. Exempeluppgifter finns
bara i sidans React-state och försvinner vid omladdning. Exemplens veckoschema är inte
verkstadens öppettider. `/` behåller CSV/Excel-verktyget utan serverlagring.

Den godkända fullständiga planen är inte färdigimplementerad. Ingen Lovable Cloud har
aktiverats och Docker Compose är oförändrad; den kör fortfarande endast filverktyget
samt den ofarliga förhandsvisningen.

## Återstående installation och implementation

För skarp drift behövs följande på den egna servern:

1. PostgreSQL på privat nätverk, beständig datavolym och säkerhetskopiering.
2. En etablerad självhostad autentiseringslösning (Better Auth är ett alternativ som
   behöver kompatibilitetstestas) med serverlagrade sessioner, säkra HttpOnly-cookies,
   e-postbekräftelse, lösenordsåterställning, begränsning av inloggningsförsök och
   separata personalroller. Ingen kund får tilldela roller eller godkänna bilkopplingar.
3. Serverfunktioner med autentisering och behörighetskontroll för varje operation.
   Kundens godkända bilkoppling kontrolleras innan bil, bokning eller bild läses.
4. Bokningar och godkännanden i PostgreSQL-transaktioner. Kapacitet ska kontrolleras
   under lås och ombokning får inte släppa den gamla tiden om den nya är full.
5. Privat bildvolym utanför public/. Hämtning via skyddad serverfunktion/handler,
   kontroll av faktiskt bildformat, storleksgräns och borttagning av EXIF-metadata.
6. HTTPS, en SMTP-lösning hos er, runtime-hemligheter och första personalkonto via
   administrativ installation. Skicka aldrig lösenord eller nycklar i chatten.
7. Tidszon Europe/Stockholm; UTC för bokningstidpunkter, tester av sommar/vintertid.
8. Inställningar för verkliga öppettider, bokningslängd, parallell kapacitet och
   stängda dagar innan bokningen öppnas för kunder.

## Acceptanskontroller före öppning

- Två kundkonton: konto A kan inte läsa eller ändra B:s bilar, bokningar eller bilder,
  även med direkt anrop eller känt bild-/boknings-ID.
- Väntande och avslagna bilkopplingar ger ingen åtkomst till befintliga uppgifter.
- Kunden kan inte själv bli personal eller godkänna bilkopplingar.
- Två samtidiga bokningar till sista platsen: exakt en lyckas.
- Misslyckad ombokning lämnar den gamla bokningen kvar; upprepade anrop är idempotenta.
- Utloggning återkallar sessionen och rensar skyddade uppgifter.
- Återställning av databas och bilder från backup provas på en separat installation.

Frontendtesterna i `customer-preview.test.ts` verifierar endast exempelmodellens
regler; de bevisar inte serverauktorisering, databaslås eller verklig säkerhet.

## Nuvarande blockerare

Ingen egen databas, autentiseringstjänst, SMTP eller privat bildlagring är ansluten i
arbetsmiljön. Projektets backend-regler kräver dessutom Lovable Cloud före backendkod,
medan användaren uttryckligen förbjuder extern drift. Ingen sådan anslutning har gjorts.
Den konflikterande driftförutsättningen måste lösas innan riktig backend kan byggas
här; förhandsvisningen får inte säljas in som färdig kundbokning.
