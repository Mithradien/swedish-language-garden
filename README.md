# 🛞 Autoflow – Däckhotell- & Verkstadssystem

> Ett modernt, helintegrerat och responsivt verksamhetssystem för däckverkstäder, däckhotell och bilservice. Utvecklat för att hantera hela flödet – från kundens tidsbokning och ankomstkiosk till montörens arbetslista, däcklager och realtidsskärmar.

[![Status](https://img.shields.io/badge/status-alpha-orange.svg)]()
[![Version](https://img.shields.io/badge/version-v0.9.0--alpha-blue.svg)]()
[![Stack](https://img.shields.io/badge/stack-TanStack%20Start%20%7C%20React%2019-black.svg)]()
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)]()

> ⚠️ **Projektstatus: Tidig Alpha**  
> Autoflow befinner sig under aktiv utveckling och testas just nu i labbmiljö och skarp verkstadsdrift. Funktioner, optimeringar och gränssnitt finslipas löpande inför första stabila produktionsreleasen.

---

## 📋 Översikt

Autoflow är byggt för att ersätta papperslistor, manuella lappar och stelbenta affärssystem med ett blixtsnabbt, webbaserat verktyg som fungerar lika bra på kontorsdatorn som på mekanikerns mobil och kundmottagningens surfplatta.

Systemet förenar intern dagsplanering och däckhotellshantering med en modern kundportal (*Mina sidor*) och dedikerade skärmvyer för kundmottagning, verkstadshall och självbetjänad ankomstregistrering.

---

## ✨ Huvudfunktioner & Moduler

### 1. 📅 Dagslista & Bokningsöversikt
* **Operativt körschema:** Full översikt över dagens bokade tider uppdelat per lyft, inklusive automatiska frukost- och lunchraster.
* **Realtidsstatusar:** Färgkodad status per bil (*Väntas, Ankommen, Ej ankommen, Påbörjad, Avbruten, Klar, Hämtad, Avbokad*).
* **Smarta snabbfilter:** Filtrera med ett klick på ankomna fordon, däckhotellskunder eller sök fritt på regnummer och kundnamn.
* **A4-utskrift i ett ark:** Skräddarsydd utskriftslayout där hela dagens lista inklusive obokade tider och raster ryms på ett enda A4-papper.
* **CSV/Excel-synk:** Stöd för att importera bokningsfiler och externa lagerlistor (t.ex. ABS AutoAssist) utan att redan registrerade ankomster eller interna statusar skrivs över.

### 2. 📊 Dashboard & Statistik
* **Grafisk verksamhetsöversikt:** Stapeldiagram över bokningar, avbokningar, ombokningar samt nya och avslutade förvaringar per dag, vecka och månad.
* **Lageranalys för däckhotell:** Tydliga cirkeldiagram och nyckeltal över aktiva förvaringar – uppdelat på sommardäck, dubbdäck och friktionsdäck.

### 3. 🔧 Personal & Verkstadsverktyg
* **Arbetslista för mekaniker:** Digital montörsvy med tydliga, färgkodade snabbknappar (*Påbörja*, *Avbryt/Återuppta*, *Klar*, *Hämtad*) för direkt statusuppdatering vid lyften.
* **Plocklista för däckhotellet:** Sammanställd lista inför dagens skiften för att i förväg lokalisera och bocka av hjul från rätt lagerhylla.
* **Verktyg för kundbilar:** Snabbinslagning eller skanning av regnummer för att dokumentera och uppdatera däckdata (mönsterdjup, dimension, fabrikat, modell, däcktyp, DOT, belastnings- och hastighetsindex) samt ladda upp skadefoton.
* **Utskrift av däcketiketter:** Generera utskriftsfärdiga etiketter för däckförvaring (anpassat för etikettskrivare t.ex. Gprinter 1225Z, 100×75 mm, valbart 1 eller 4 etiketter per bil).

### 4. 📺 Skärmar & Kioskflöden
* **Ankomstkiosk (Surfplatta):**
  * Optimerat pekskärmsgränssnitt med integrerat knappsats för regnummer.
  * Helskärms- och kioskläge som förhindrar att surfplattans inbyggda skärmtangentbord poppar upp.
  * Stor och tydlig bekräftelse innan ankomsten registreras.
  * Automatisk återställning efter slutförd registrering (10 sekunder) eller vid inaktivitet (45 sekunder) för att skydda föregående kunds uppgifter.
* **Kundmottagningsskärm:** Rullande informationsskärm som visar ankomna och närmast väntade bilar, döljer uteblivna och håller besökare informerade om aktuell status.
* **Verkstadsskärm:** Kanban-baserad översikt för hallen som visar vilka bilar som väntar, pågår eller är klara för utlämning.
* **Dedikerad "Skärm"-roll:** Eget lösenordsskyddat konto avsett för TV-skärmar och surfplattor – ger tillgång till skärmvyerna men blockerar alla administrativa verktyg.

### 5. 👤 Kundportal (Mina Sidor)
* **Mina bilar:** Kunden ser sina egna registrerade fordon och däckhotellsuppgifter (lagerplats, hjulsats, däckspecifikation).
* **Färgkodat mönsterdjup:** Pedagogisk visning av mönsterdjup med fyra varningsnivåer (grön, gul, orange, röd) och separata gränsvärden för sommar- respektive vinterdäck.
* **Skifteshistorik:** Komplett överblick över tidigare genomförda skiften och mönsterdjupsutveckling över säsonger.
* **Förnya förvaring:** Kunden kan själv godkänna förvaring inför kommande säsong med frysta villkors- och prisögonblicksbilder som sparas och visas för personalen.
* **Kundens exempelvy:** Personal kan med ett klick öppna en isolerad exempelvy för att visa och demonstrera portalen utan att logga in på ett specifikt kundkonto.

### 6. ⚙️ Administration & Säkerhet
* **Rollbaserad behörighet (RBAC):**
  * `superadmin` – Full tillgång till hela systemet, alla inställningar och databasen.
  * `useradmin` – Kan skapa och hantera mekaniker- och kundkonton.
  * `mekaniker` – Tillgång till dagslista, arbetslista, plocklista och bilverktyg.
  * `skarm` – Begränsad visning avsedd för surfplattor och väggskärmar.
  * `kund` – Åtkomst enbart till egna fordon och bokningar på Mina sidor.
* **Kontohantering med flikar & sök:** Sortering uppdelad i *Admins*, *Mekaniker*, *Kunder* och *Övrigt*. Sök på personnamn, e-post, registreringsnummer, telefon, ort och bilmodell.
* **Kundöversikt för administratörer:** Direktvy över en kunds fordon och historik utan riskfylld kontoväxling/impersonation.
* **Systeminställningar:**
  * Arbetspass, lyftar och bokningsintervall (15/30 min etc.).
  * Differentierad prislista baserad på fälgstorlek (tum).
  * Justerbara färggränser för mönsterdjup.
  * Företagsuppgifter och profilering (logotyp, färger, kontaktinformation).
  * Egen SMTP-serverkonfiguration för automatiska bokningsbekräftelser via e-post.

---

## 🛠️ Teknisk Arkitektur

| Komponent | Teknologi |
|---|---|
| **Ramverk** | [TanStack Start v1](https://tanstack.com/start) & React 19 (full SSR & server functions) |
| **Stilsystem** | [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) |
| **Databas** | PostgreSQL med Row Level Security (RLS) |
| **Paketering** | Docker & Docker Compose |
| **Driftmiljö** | Egen server (Proxmox LXC / Docker / Portainer) |
| **Webbserver / SSL** | Nginx / Nginx Proxy Manager (Let's Encrypt HTTPS) |

---

## 🚀 Drift & Installation (Egen Server)

Autoflow är utvecklat för att köras helt oberoende på egen infrastruktur:

```text
               ┌─────────────────────────────────────┐
               │    Nginx Proxy Manager / Traefik    │ (HTTPS / SSL)
               └──────────────────┬──────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
┌────────▼──────────────┐                         ┌────────▼──────────────┐
│  Stack 1: autoflow    │                         │  Stack 2: databas     │
│  (Node.js / Port 3000)│ ◄─── API / Auth / RLS ──┤  (PostgreSQL + Auth)  │
└───────────────────────┘                         └───────────────────────┘
