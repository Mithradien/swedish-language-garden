📦 Kommande uppdatering: Patch v0.9.1-alpha
Fokus för denna patch: Utökad administration av kunduppgifter, smidigare hantering av däckutlämning, samlad företagsöversikt samt förberedelser för notiser och väderinfo på mottagningsskärmen.

1. 👤 Kundportal & Administration
Aktivt redigeringsläge för kunduppgifter:
Administratörer kan nu klicka på "Redigera" i kundvyn för att direkt uppdatera kundens kontaktuppgifter, adress samt kopplade bilar utan att behöva logga in på kundens konto.
Beställning av hjul utan skifte ("Hämta hjul"):
En ny funktion på Mina sidor där kunden kan anmäla att de vill hämta ut sina förvarade hjul utan hjulskifte. Kunden väljer önskat datum och verkstaden får upp detta i plocklistan så att hjulen står redo.
2. 🏢 Företagshantering & Samlade utskrifter
Företagssökning & fordonsöversikt:
Möjlighet att söka fram ett specifikt företag och se alla bilar som är kopplade till samma bolag.
Filtrerad utskrift för företag:
Valmöjlighet att skriva ut en samlad lista över företagets bilar baserat på status:
Endast aktiva förvaringar
Endast avslutade förvaringar
Både aktiva och avslutade förvaringar
3. 🔧 Verktyg för kundbilar & Etiketter
Utökad däcksymbolik & specifikation:
Mekanikervyn för kundbilar kompletteras med snabbfält för DOT-märkning, belastningsindex (LI) och hastighetsindex (SI).
Säsongshistorik för etiketter:
Möjlighet att se och följa vilka säsongsfärger som använts vid tidigare års märkningar på däckhotellet.
4. 📺 Skärmar & Information
Dagens väder i kundmottagningen:
Kundmottagningens väntskärm kompletteras med en diskret väderruta som visar aktuell temperatur och vädersymbol för dagen.
5. 🔔 Larm & Notiscenter (Steg 1)
Larm för kvarglömda däck:
Visuell indikering och varning för förvaringshjul som legat kvar på däckhotellet över en hel säsong utan bokad tid eller godkänd förnyelse.
Varning för slitna däck:
Tydlig flaggning för fordon där mönsterdjupet understiger säkerhetsgränsen, förberett för framtida automationsutskick.
6. 🖥️ Självdrift (Docker & Portainer)
Färdiga driftsmallar:
Nyckelfärdiga docker-compose.yml-filer och databasmall för snabb distribution direkt i Portainer på Proxmox LXC.
