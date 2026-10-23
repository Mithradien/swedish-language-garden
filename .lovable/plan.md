# Kundbokning på egen server – första versionen

## Resultat
En kundsida där kunden skapar konto, begär koppling till sin bil, bokar och bokar om samt ser status och registrerade däckuppgifter. Konton, bokningar och bilder ligger på er egen server. Det nuvarande CSV/Excel-verktyget behålls utan ändrad filhantering.

## Kundens sida
- Skapa konto med e-post, lösenord, namn och telefon; logga in, logga ut och återställa lösenord.
- Begära koppling till ett eller flera regnummer. Befintliga uppgifter visas först när personalen godkänt kopplingen.
- Välja bil, tjänst, dag och ledig tid från era fasta öppettider.
- Se bokningsstatus och boka om till en ledig tid.
- Se mönsterdjup, eventuell DOT och bilder som personalen registrerat för egna godkända bilar.

## Personalens sida
- Hantera bokningar och deras status.
- Godkänna eller avslå förfrågningar om bilkoppling efter kontroll av kunden.
- Registrera däckuppgifter och lägga upp privata bilder.
- Ställa in öppettider, tidslängd, antal samtidiga bokningar och stängda dagar. Inga påhittade öppettider aktiveras; bokningen öppnar först efter era inställningar.

## Säkerhet
- Åtkomst till varje bil, bokning och bild kontrolleras på servern, inte bara genom att dölja saker på sidan.
- Kunden kan inte själv ge sig personalbehörighet eller godkänna sitt regnummer.
- Bokning och ombokning genomförs som en sammanhållen databasändring för att undvika dubbelbokningar; den gamla tiden behålls om den nya inte längre är ledig.
- Privata bilder ska inte kunna nås genom en offentlig bildadress. Filtyp och storlek kontrolleras vid uppladdning.
- Lösenord lagras endast som säkra hashvärden; sessioner använder säkra cookies. HTTPS krävs vid extern åtkomst.

## Teknisk lösning
- Behåll TanStack Start och Docker/LXC-driftsformen.
- PostgreSQL på den egna servern för konton, kundprofiler, separata personalroller, bilkopplingar, däckuppgifter, scheman och bokningar.
- Bildfiler på en beständig volym på den egna servern, med åtkomstkontroll när de hämtas.
- Använd en etablerad autentiseringslösning kompatibel med egen drift, inte egenkonstruerad lösenords- eller sessionssäkerhet.
- Utöka Docker-upplägget med databas, beständiga volymer och dokumenterade säkerhetskopior. Befintliga CSV-filer ska inte automatiskt importeras eller publiceras till kunder.

## Genomförande och kontroll
1. Egen databas, säkra konton och grundläggande personalåtkomst.
2. Kund-/bilkoppling och personalens godkännande.
3. Öppettider, lediga tider, bokning och ombokning.
4. Däckuppgifter, status och privata bilder.
5. Testa med två kundkonton och ett personalkonto: kunder ser bara sina uppgifter och samtidiga bokningar kan inte överboka en tid.

## Förutsättningar och gränser
- Ingen Lovable Cloud aktiveras eftersom ni valt att allt ska ligga hos er.
- Den egna databas- och inloggningslösningen måste kunna köras innan verkliga kundflöden kan verifieras; en klickbar förhandsvisning räknas inte som säker inloggning.
- E-post för bekräftelse och lösenordsåterställning behöver en fungerande e-postlösning hos er; lösenord eller e-postnycklar ska aldrig skickas i chatten.
- Betalning, SMS och automatisk synk med WordPress ingår inte i första versionen.