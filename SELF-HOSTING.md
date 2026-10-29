# Köra bokningsverktyget på egen server

Det här är en enda webbsida. Den har ingen databas, inga inloggningar och inga hemliga nycklar.
CSV-filen och Excel-filen läses in i webbläsaren varje gång du öppnar sidan – ingenting skickas
upp eller sparas på servern.

Det du behöver är alltså bara en maskin (LXC, VM eller Docker-container) som kör ett litet
Node-program och visar sidan utåt.

## 1. Hämta koden

Välj ett av två sätt i Lovable:

- **Git sync** – projektet synkas till ett eget GitHub-, GitLab- eller Bitbucket-repo
  (Project settings → Git sync). Bra om du vill kunna uppdatera genom att bara göra en ny push.
- **Download codebase** – en zip-fil med hela projektet (kodeditorn → Download codebase).

Kopiera koden till maskinen, till exempel med `git clone` eller `scp`.

## 2. Bygg och kör

### Alternativ A – Docker

```bash
docker build -t bokningar .
docker run -d --name bokningar -p 3000:3000 --restart unless-stopped bokningar
```

Eller med compose:

```bash
docker compose up -d --build
```

Sidan ligger då på `http://din-server:3000`.

### Alternativ B – direkt på LXC eller VM (utan Docker)

```bash
npm install
NITRO_PRESET=node-server npm run build
node .output/server/index.mjs
```

Bygget skriver en fristående mapp `.output` som innehåller allt som behövs för att köra.
Servern lyssnar på port 3000; byt med `PORT` och `HOST`, till exempel:

```bash
PORT=3000 HOST=0.0.0.0 node .output/server/index.mjs
```

#### Köra automatiskt vid start (systemd)

Skapa `/etc/systemd/system/bokningar.service`:

```ini
[Unit]
Description=Bokningsverktyg
After=network.target

[Service]
WorkingDirectory=/opt/bokningar
ExecStart=/usr/bin/node .output/server/index.mjs
Environment=PORT=3000
Environment=HOST=0.0.0.0
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now bokningar
```

## 3. Gör sidan åtkomlig utifrån (Nginx + HTTPS)

Sätt Nginx framför servern så att den sköter domän och certifikat:

```nginx
server {
    listen 80;
    server_name bokningar.dindomän.se;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Skaffa ett gratis Let's Encrypt-certifikat:

```bash
sudo certbot --nginx -d bokningar.dindomän.se
```

Använd du ingen egen domän kan du istället öppna port 3000 direkt i brandväggen,
men då utan HTTPS – rekommenderas inte om sidan nås över internet.

## 4. Kontrollera att det fungerar

1. Öppna `https://bokningar.dindomän.se` (eller `http://din-server:3000`).
2. Välj CSV-filen från bokningssystemet – antalet bokningar ska dyka upp.
3. Öppna fliken **Listor**, välj en dag och klicka **Skriv ut** – utskriftsfönstret ska komma.
4. Har du Excel-filen med: välj den under **Billager (Excel)** och kontrollera att lagerplatser
   visas i listorna.

## Bra att veta

- **Ingen data sparas.** Varje besökare läser in sina egna filer lokalt i webbläsaren. Servern
  lagrar alltså inga bokningar och behöver ingen backup.
- **Ingen inloggning.** Alla som känner till adressen kan använda verktyget. Eftersom inga
  uppgifter skickas upp är risken liten, men vill du hålla det internt kan du begränsa åtkomsten
  med lösenordsskydd i Nginx (`auth_basic`) eller genom att bara släppa in era IP-adresser.
- **Uppdatering.** Ändrar du något i Lovable: hämta den nya koden (ny push eller ny zip) och kör
  om steget i avsnitt 2. Med Docker räcker `docker compose up -d --build`.
- **Om bygget kraschar i alpine.** Byt `node:22-alpine` till `node:22` i Dockerfile – vissa
  byggverktyg gillar Debian-basen bättre.

## Bekräftelsemail vid bokning (egen SMTP)

När en kund bokar skickas ett bekräftelsemail via er egen mejlserver. Sätt dessa
miljövariabler (t.ex. under `environment:` i docker-compose.yml eller `Environment=` i systemd):

| Variabel | Exempel |
|---|---|
| `SMTP_HOST` | `send.one.com` |
| `SMTP_PORT` | `587` (465 = SSL) |
| `SMTP_USER` | `bokning@dindomän.se` |
| `SMTP_PASS` | lösenordet till mejlkontot |
| `SMTP_FROM` | `bokning@dindomän.se` |
| `SITE_URL` | `https://bokningar.dindomän.se` (länken till Mina sidor) |

Saknas `SMTP_HOST` eller `SMTP_FROM` sparas bokningen ändå, men inget mejl skickas.
Företagsnamn, adress och telefon i mejlet hämtas från Inställningar → Företagsuppgifter.
