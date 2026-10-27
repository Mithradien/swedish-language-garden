# Kundbokning på egen server

- [x] Visa obokade schematider som tomma rader i bokningsöversikt och utskrift.

- [ ] Fastställ och godkänn första versionens upplägg för egen drift.
- [ ] Bygg säkra kundkonton och separata personalbehörigheter på egen server.
- [ ] Lägg till kundprofiler, godkända bilkopplingar och privata däckuppgifter/bilder.
- [ ] Lägg till inställbara öppettider, bokning och säker ombokning utan dubbelbokning.
- [ ] Verifiera kund- och personalflöden mot egen databas och dokumentera drift/backup.

Förutsättning: ingen Lovable Cloud eller extern lagring; verkliga inloggningar och lagring behöver kunna köras och verifieras på den egna serverlösningen.

# Nuvarande att-göra (en punkt i taget, avstämning inför varje)

- [x] Spara inläst CSV/Excel lokalt i webbläsaren, plus knapp för att rensa.
- [x] Bara ankomsttid i tidskolumnen (t.ex. `07:00`).
- [x] Rast-rader: Frukostrast 09:00–09:15 och Lunchrast 12:00–12:45.
- [x] Statusmarkering per bil: grön Ankommen, röd Ej ankommen, orange Avbokad, neutral Väntas.
- [x] Ta bort fliken "Listor".
- [x] Excel-stöd för både bantad och 4-raders detaljerad AutoAssist-fil, med däckkort (mönsterdjup, dimension) i "Sök regnr".
- [ ] Fliken "Inställningar" (logotyp, färger/tema, företagsuppgifter).
