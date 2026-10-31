# 🛞 Autoflow – Däckhotell- & Verkstadssystem

> Ett modernt, helintegrerat och responsivt verksamhetssystem för däckverkstäder, däckhotell och bilservice. Utvecklat för att hantera hela flödet – från kundens tidsbokning och ankomstkiosk till montörens arbetslista, däcklager och realtidsskärmar.

---

## 📋 Översikt

Autoflow är byggt för att ersätta papperslistor, manuella lappar och stelbenta system med ett snabbt, webbaserat verktyg som fungerar lika bra på verkstadens datorer som på surfplattor och mobiler. 

Systemet kombinerar intern dagsplanering och däckhotellshantering med en modern kundportal ("Mina sidor") och dedikerade skärmvyer för kundmottagning och verkstad.

---

## ✨ Huvudfunktioner & Moduler

### 1. 📅 Dagslista & Bokningsöversikt
* **Operativ dagslista:** Få full översikt över dagens alla bokade tider per lyft, med frukost- och lunchraster inlagda.
* **Status i realtid:** Färgkodad status för varje bil (*Väntas, Ankommen, Ej ankommen, Påbörjad, Avbruten, Klar, Hämtad, Avbokad*).
* **Snabbfilter & Sök:** Filtrera direkt på ankomna bilar, däckhotellskunder eller sök på regnummer och kundnamn.
* **A4-utskrift:** Kompakt och stilren dagsutskrift anpassad för att rymma hela dagens körschema och raster på ett enda pappersark.
* **CSV/Excel-stöd:** Möjlighet att läsa in externa bokningsfiler och lagerlistor (t.ex. ABS AutoAssist) utan att skriva över registrerade ankomster.

### 2. 📊 Dashboard & Statistik
* **Grafisk översikt:** Se antal bokningar, avbokningar, ombokningar samt nya och avslutade förvaringar per dag, vecka och månad.
* **Däcklageranalys:** Nyckeltal och fördelning över aktiva förvaringar – uppdelat på sommardäck, dubbdäck och friktionsdäck.

### 3. 🔧 Personal & Verkstadsverktyg
* **Arbetslista för mekaniker:** Digital montörsvy där personalen enkelt klickar *Påbörja*, *Avbryt/Återuppta*, *Klar* och *Hämtad* med tydliga färgknappar.
* **Plocklista för däckhotellet:** Samlad lista för att i förväg lokalisera och bocka av hjul från rätt lagerhylla inför dagens skiften.
* **Verktyg för kundbilar:** Slå upp regnummer för att registrera eller uppdatera däckdata (mönsterdjup, dimension, fabrikat, modell, däcktyp, DOT, belastnings-/hastighetsindex) samt ladda upp skadefoton.
* **Däcketiketter:** Utskrift av etiketter för däckförvaring (anpassat för etikettskrivare t.ex. Gprinter, 100×75 mm, 1 eller 4 etiketter per bil).

### 4. 📺 Skärmar & Kioskflöden
* **Ankomstkiosk (Surfplatta):**
  * Pekskärmsanpassat numeriskt tangentbord.
  * Helskärmsläge som förhindrar surfplattans inbyggda tangentbord från att poppa upp.
  * Stor och tydlig bekräftelse av registrerat regnummer.
  * Automatisk återställning efter slutförd ankomst (10 sek) eller vid inaktivitet (45 sek) för att skydda kundens integritet.
* **Kundmottagningsskärm:** Rullande skärm som visar väntande och ankomna bilar, döljer uteblivna och håller kunder informerade om aktuell status.
* **Verkstadsskärm:** Överskådlig Kanban-vy för montörerna i verkstadshallen.
* **Dedikerad "Skärm"-roll:** Eget lösenordsskyddat konto för TV-apparater och surfplattor som enbart ger åtkomst till skärmvyerna och döljer administrativa funktioner.

### 5. 👤 Kundportal (Mina Sidor)
* **Kopplade fordon:** Kunden ser sina egna bilar och däckhotellsuppgifter (lagerhylla, hjulsats, däckspecifikation).
* **Mönsterdjupsvisning:** Tydlig visning av mönsterdjup med pedagogisk färgkodning (grön, gul, orange, röd) och separata gränsvärden för sommar- och vinterdäck.
* **Skifteshistorik:** Historik över tidigare genomförda skiften och mönsterdjupsutveckling över säsonger.
* **Förnya förvaring:** Kunden kan själv godkänna förnyelse av förvaringen inför kommande säsong med frysta pris- och villkorsögonblicksbilder.
* **Kundens exempelvy:** Personal kan med ett klick öppna en säker exempelvy för att visa och demonstrera kundportalen utan att logga in på en specifik kunds konto.

### 6. ⚙️ Administration & Säkerhet
* **Rollbaserad behörighet (RBAC):**
  * `superadmin` – Full behörighet till system, databas och alla inställningar.
  * `useradmin` – Kan hantera mekaniker- och kundkonton.
  * `mekaniker` – Tillgång till dagslista, arbetslista, plocklista och bilverktyg.
  * `skarm` – Begränsad visning för ankomstkiosk och verkstads-/mottagningsskärmar.
  * `kund` – Åtkomst enbart till egna fordon och bokningar på Mina sidor.
* **Kontohantering med flikar & sök:** Indelning i Admins, Mekaniker, Kunder och Övrigt. Sökning på namn, regnummer, telefon, ort och bilmodell.
* **Kundöversikt:** Direktvy över en kunds bilar och uppgifter utan riskfylld kontoväxling/impersonation.
* **Systeminställningar:**
  * Anpassa arbetspass, lyftar och bokningsintervall.
  * differentierade priser baserat på fälgstorlek (tum).
  * Justerbara mönsterdjupsgränser.
  * Företagsuppgifter och branding (logotyp, tema och kontaktuppgifter).
  * Egen SMTP-server för automatiska bokningsbekräftelser via e-post.

---

## 🛠️ Teknisk Arkitektur

* **Frontend & Backend:** Byggt med [TanStack Start](https://tanstack.com/start) & React 19, server functions och full SSR.
* **Stilmall & UI:** [Tailwind CSS v4](https://tailwindcss.com/) och [shadcn/ui](https://ui.shadcn.com/) med konsekventa designtokens och full responsivitet.
* **Databas & Säkerhet:** PostgreSQL med Row Level Security (RLS) som garanterar att kunder endast når sina egna uppgifter.
* **Infrastruktur & Egendrift:** 
  * Dockerfile och Docker Compose för smidig paketering.
  * Anpassat för drift på egen server (Proxmox LXC / Docker / Portainer) utan beroende av externa molntjänster.
  * Reverse proxy-redo (Nginx / Nginx Proxy Manager / Traefik) med Let's Encrypt SSL.

---

## 🚀 Kom igång (Egendrift)

```bash
# 1. Klona repot
git clone https://github.com/ditt-anvandarnamn/autoflow.git
cd autoflow

# 2. Skapa miljövariabler (.env)
cp .env.example .env

# 3. Starta via Docker Compose
docker compose up -d --build
