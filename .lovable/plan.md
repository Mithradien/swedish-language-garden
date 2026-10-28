# Bilvy för administratörer

## Den här etappen
- Klick på ett regnummer i Bokningsöversikt öppnar just den bilens samlade uppgifter i en stor bilvy.
- Sök regnr visar matchande bilar, även bilar som bara finns i Excel-listan. Samma bilvy öppnas från sökresultatet.
- Bilvyn följer kundsidans upplägg: bil/modell, kunduppgifter, lagerplats, däckuppgifter och mönsterdjup per hjul med samma sommar-/vinterfärger.
- Visa bilens bokningar, registrerade statusändringar och befintliga däckprotokoll. Bara uppgifter som faktiskt finns visas; saknade uppgifter markeras tydligt och inga exempeldata blandas in.
- Flytta statusvalet till en separat knapp intill regnumret så att Ankommen/Väntas fortfarande kan ändras utan att öppna bilen.
- Bilvyn är skrivskyddad i denna etapp och tillgänglig för inloggad personal. Kundsidans konton och bilkopplingar ändras inte.

## Tekniskt upplägg
- Återanvänd kundsidans mönsterdjupsvisning i en gemensam komponent och befintlig klassificering i `src/lib/tread.ts`.
- Utgå från översiktens redan inlästa bokningar och Excel-däckkort. Läs befintliga `status_events` och `work_orders` med ordinarie inloggad klient och befintliga åtkomstregler, utan ändringar av databasen.
- Behåll översiktens filter och sökning när bilvyn stängs.
- Testa exakt regnummermatchning så att andra bilars bokningar eller däckuppgifter inte blandas in, och kontrollera hela flödet som inloggad administratör samt på telefon och dator.

## Avgränsning
Excel-uppgifter är fortfarande tillgängliga i webbläsaren där filen lästes in. Saknade bilder, DOT-uppgifter eller äldre historik skapas inte automatiskt.