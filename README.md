# StoryWriter – Local-first Buch-Schreib-App

StoryWriter ist ein bewusst einfacher Single-User-MVP: Manuskript, Gedanken, Figuren und Plot-Fäden liegen primär beim Autor. Der Browser speichert sofort in IndexedDB; auf Chromium-Browsern kann ein normal lesbarer Projektordner verbunden werden. AI-Vorschläge werden **nie automatisch** in das Manuskript übernommen.

## Voraussetzungen

- Node.js 20 oder neuer
- Ein Cloudflare-Konto und Wrangler (`npm install` installiert es lokal)
- Ein OpenAI-API-Key
- Für die Ordner-Verknüpfung: Chrome oder Edge (die App funktioniert in anderen aktuellen Browsern mit IndexedDB)

## 1. Lokal starten

```bash
npm install
cp wrangler.toml.example wrangler.toml
cp .env.example .dev.vars
```

## 2. Sichere Zugangsdaten erzeugen

Erzeuge den Passwort-Hash (das Klartextpasswort wird nur an dieses lokale Skript übergeben):

```bash
node scripts/hash-password.mjs "MEIN-LANGES-PASSWORT"
```

Kopiere die ausgegebene vollständige `pbkdf2$…`-Zeile nach `.dev.vars` als `APP_PASSWORD_HASH`. Trage dort außerdem `APP_USERNAME` und `OPENAI_API_KEY` ein. Erzeuge ein Session-Geheimnis, zum Beispiel mit `openssl rand -base64 48`, und trage es als `SESSION_SECRET` ein. `.dev.vars` wird von Git ignoriert.

Starte anschließend:

```bash
npm run dev
```

Öffne die von Wrangler angezeigte Adresse, normalerweise `http://localhost:8787/login.html`. Melde dich an, lege dein erstes Buch an und wähle im Projekt optional **Projektordner verbinden**. Ohne Ordner bleibt das Projekt sicher in diesem Browserprofil; regelmäßige JSON-Exporte werden empfohlen.

## 3. Cloudflare Worker deployen

1. Mit `npx wrangler login` bei Cloudflare anmelden.
2. In `wrangler.toml` einen eindeutigen Worker-Namen setzen.
3. Die Secrets einzeln setzen (Wrangler fragt jeweils verdeckt nach dem Wert):

```bash
npx wrangler secret put APP_PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
npx wrangler secret put OPENAI_API_KEY
```

4. `APP_USERNAME` steht ohne Passwort in `[vars]` der `wrangler.toml`; alternativ kann auch dieser Wert mit `npx wrangler secret put APP_USERNAME` gesetzt werden.
5. Deployen: `npx wrangler deploy`.
6. Die angezeigte `workers.dev`-Adresse mit `/login.html` öffnen und Anmeldung sowie das Erstellen eines Testprojekts prüfen.

Der Worker setzt eine signierte, sieben Tage gültige Session in einem `HttpOnly`, `Secure`, `SameSite=Strict` Cookie. OpenAI wird ausschließlich über `/api/ai` vom Worker aufgerufen. Der API-Key und Passwort-Hash werden weder an den Browser geschickt noch in LocalStorage gespeichert.

## Daten und Backups

- **IndexedDB:** automatischer Fallback und erste Speicherung, debounced nach 750 ms.
- **Projektordner:** `project.json`, Markdown-Kapitel sowie JSON-Dateien für Figuren, Story und AI Memory. Browser benötigen nach einem Neustart eventuell erneut eine Zugriffsbestätigung.
- **Export:** JSON enthält das vollständige portable Projekt; Markdown fügt alle Kapitel zu einem Manuskript zusammen.
- **Löschen:** verschiebt erst nach Warnung und exakter Titeleingabe in den Papierkorb und lädt davor ein Backup herunter. Endgültiges Löschen erfordert den Titel erneut und erzeugt wieder ein Backup.

> Wichtig: IndexedDB gehört zum jeweiligen Browserprofil und zur exakten Website-Adresse. Browserdaten löschen kann nicht verbundene Projekte entfernen. Deshalb einen Projektordner verbinden oder regelmäßig exportieren.

## Entwicklung und Checks

```bash
npm test
npm run check
```

Keine Vector-Datenbank, Registrierung, Mehrbenutzerverwaltung oder Cloud-Datenbank ist Teil dieses MVP.
