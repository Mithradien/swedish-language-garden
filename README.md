# Boknings- och Lagerhanterare

Ett smidigt verktyg för att sammanställa bokningsdata och lagerinformation för verkstad och däckhotell.

## 📌 Översikt

Detta system förenklar den dagliga planeringen genom att automatiskt samköra bokningsuppgifter från en WordPress-webbplats med bilars lagerplatser i däckhotellet. 

Systemet tar emot en exporterad CSV-fil från WordPress, extraherar relevant bokningsinformation och matchar registreringsnumren mot ett Excel-register. Det ger personalen en snabb och komplett översikt över schema, lagerplatser och verkstadsstatistik.

## ✨ Huvudfunktioner

* **Bokningsimport:** Läser in CSV-filer genererade från WordPress-bokningssystemet.
* **Datamatchning & Lagerkoppling:** Extraherar bokningstid, registreringsnummer och beställd tjänst samt kopplar automatiskt ihop registreringsnumret med däckhotellets Excel-register för att visa exakt **lagerplats**.
* **Dagliga Listor:** Skapa och skriv ut klara arbets- och plocklistor per dag för smidig hantering i verkstaden.
* **Sökning på Regnummer:** Sök snabbt på ett enskilt registreringsnummer för att se befintliga bokningar, vald tjänst och tillhörande lagerplacering.
* **Statistik & Uppföljning:** Inbyggd statistikvy som ger överblick över antal bokningar, populära tjänster och beläggning över tid.

## 🛠️ Arbetsflöde

1. Exportera CSV-filen med bokningar från WordPress.
2. Importera CSV-filen i programmet.
3. Systemet matchar automatiskt alla bokningar mot däckhotellets Excel-databas.
4. Sök fram enskilda bilar, ta ut dagliga arbetslistor eller följ upp verkstadens statistik.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
