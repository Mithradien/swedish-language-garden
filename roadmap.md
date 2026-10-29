# Kundbokning på egen server

- [x] Surfplattans ankomstsida: regnummer, dagens bokning, bekräftelse och lokal ankomstmarkering med tidpunkt, helskärm och automatisk återställning.
- [ ] Koppla ankomst och besökshistorik mellan surfplatta och personalens dator (kräver egen server/databas).

- [x] Visa obokade schematider som tomma rader i bokningsöversikt och utskrift.

- [ ] Fastställ och godkänn första versionens upplägg för egen drift.
- [ ] Bygg säkra kundkonton och separata personalbehörigheter på egen server.
- [ ] Lägg till kundprofiler, godkända bilkopplingar och privata däckuppgifter/bilder.
- [x] Inställbara bokningstider (Inställningar → Bokningar: arbetspass + intervall).
- [ ] Verifiera kund- och personalflöden mot egen databas och dokumentera drift/backup.

Förutsättning: ingen Lovable Cloud eller extern lagring; verkliga inloggningar och lagring behöver kunna köras och verifieras på den egna serverlösningen.

# Nuvarande att-göra (en punkt i taget, avstämning inför varje)

- [x] Bilvy för inloggad personal från regnummer och sökning: kunduppgifter, Excel-däckkort, bokningar, statusändringar och däckprotokoll; separat statusknapp. Verifierad som administratör på dator och telefon.

- [x] Kompakt A4-utskrift så att en hel dagslista med obokade tider och raster ryms på ett ark.

- [x] Färgmarkering av mönsterdjup på kundsidan med separata sommar- och vintergränser.
- [x] Superadmin kan justera mönsterdjupsgränser i inställningar (väntar på riktiga personalbehörigheter på egen server).

- [x] Spara inläst CSV/Excel lokalt i webbläsaren, plus knapp för att rensa.
- [x] Bara ankomsttid i tidskolumnen (t.ex. `07:00`).
- [x] Rast-rader: Frukostrast 09:00–09:15 och Lunchrast 12:00–12:45.
- [x] Statusmarkering per bil: grön Ankommen, röd Ej ankommen, orange Avbokad, neutral Väntas.
- [x] Ta bort fliken "Listor".
- [x] Excel-stöd för både bantad och 4-raders detaljerad AutoAssist-fil, med däckkort (mönsterdjup, dimension) i "Sök regnr".
- [x] Fliken "Inställningar" (logotyp, färger/tema, företagsuppgifter).
- [x] Inställningar som egen sida i toppmenyn (/installningar) med samma meny på alla sidor.
- [x] Konto under Inställningar kopplat till befintlig användar- och rollhantering.

# Kundens bokningssida (skiss, ingen databas ännu)

- [x] Stegvis flöde på /boka: regnummer, två däckfrågor, dag och tid, uppgifter, bekräftelse.
- [x] 48-h-förhållning, raster, måndag–fredag och låsta/upptagna tider i tidvalen.
- [x] Riktiga priser in i prislistan (just nu platshållare: 590 / 890 / 1290 / 350 kr).
- [ ] Koppla flödet till egen databas: bokningar, kunder och lagerplatser.
- [x] Personalens låsning och öppning av tider styr vilka tider som visas i flödet (per enskild tid).
- [x] Roll "Användaradmin": låsa tider, flytta/avboka, godkänna väntande bilar, skapa mekaniker-/kundkonton.

# Utskick och kundkontakt
- [x] Bekräftelsemail vid bokning (egen SMTP, Inställningar → E-post).
- [ ] SMS-påminnelse dagen innan – väntar på att ni skaffar SMS-tjänst (t.ex. 46elks).
- [ ] Digitalt däckkvitto & hämtningsmejl när bilen markeras "Klar".
- [ ] Automatiserad däckoffert med 3 prisförslag.
- [ ] QR-skylt för ankomst (väntar).
- [ ] Surfplatta-anpassning av ankomstskärmen (väntar).
- [ ] Roterande hjul i bakgrunden på ankomstsidan (väntar).
