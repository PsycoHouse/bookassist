# StoryWriter – Local-first Buch-Schreib-App

StoryWriter ist ein bewusst einfacher Single-User-MVP: Manuskript, Gedanken, Figuren und Plot-Fäden liegen primär beim Autor. Der Browser speichert sofort in IndexedDB; auf Chromium-Browsern kann ein normal lesbarer Projektordner verbunden werden. AI-Vorschläge werden **nie automatisch** in das Manuskript übernommen.

## Voraussetzungen

- Node.js 20 oder neuer
- Ein Cloudflare-Konto und Wrangler (`npm install` installiert es lokal)
- Ein OpenAI-API-Key
- Für die Ordner-Verknüpfung: Chrome oder Edge (die App funktioniert in anderen aktuellen Browsern mit IndexedDB)

## 1. Lokal starten!

```bash
npm install
cp .env.example .dev.vars
```

## 2. Zugangsdaten einrichten

Trage dein Passwort in `.dev.vars` als `APP_PASSWORD` ein. Verwende dafür ein langes, nur für diese App genutztes Passwort. Trage dort außerdem `APP_USERNAME` und `OPENAI_API_KEY` ein. Erzeuge ein Session-Geheimnis, zum Beispiel mit `openssl rand -base64 48`, und trage es als `SESSION_SECRET` ein. `.dev.vars` wird von Git ignoriert. Das Passwort wird nicht gehasht, liegt aber ausschließlich als lokales beziehungsweise Cloudflare-Secret vor und wird nicht an den Browser ausgeliefert.

Starte anschließend:

```bash
npm run dev
```

Öffne die von Wrangler angezeigte Adresse, normalerweise `http://localhost:8787`. Melde dich an, lege dein erstes Buch an und wähle im Projekt optional **Projektordner verbinden**. Ohne Ordner bleibt das Projekt sicher in diesem Browserprofil; regelmäßige JSON-Exporte werden empfohlen.

## 3. Cloudflare Worker deployen

1. Mit `npx wrangler login` bei Cloudflare anmelden.
2. Die eingecheckte `wrangler.toml` verwendet bereits den Worker-Namen `bookassist`, den Entry-Point `worker/worker.js` und veröffentlicht das Frontend aus `public/` als Worker Assets. Damit ist die App unter `https://bookassist.gamer-33.workers.dev` erreichbar.
3. Die Secrets einzeln setzen (Wrangler fragt jeweils verdeckt nach dem Wert):

```bash
npx wrangler secret put APP_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put OPENAI_API_KEY
```

4. Den Benutzernamen als Runtime-Variable im Cloudflare-Dashboard (`Settings` → `Variables and Secrets`) unter `APP_USERNAME` setzen. Er ist kein Secret; er kann alternativ mit `npx wrangler secret put APP_USERNAME` gesetzt werden.
5. Deployen: `npm run deploy`.
6. `https://bookassist.gamer-33.workers.dev` öffnen und Anmeldung sowie das Erstellen eines Testprojekts prüfen.

GitHub dient ausschließlich als Quell-Repository für Cloudflare Workers Builds. GitHub Pages
wird nicht benötigt und sollte in den Repository-Einstellungen deaktiviert sein. Oberfläche,
API und das sichere Session-Cookie bleiben dadurch auf demselben Worker-Ursprung.

### Cloudflare Workers Builds

Für dieses Repository ist kein Frontend-Build nötig. In Cloudflare wird das vorhandene
Worker-Projekt `bookassist` mit dem GitHub-Repository verbunden und wie folgt konfiguriert:

- **Root Directory:** Repository-Root (`/`; das Feld kann leer bleiben)
- **Build Command:** leer (optional kann `npm test` als Prüfung verwendet werden)
- **Deploy Command:** `npm run deploy`

Die vier Werte `APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET` und `OPENAI_API_KEY` müssen
unter den **Runtime** Variables and Secrets des Workers gesetzt werden, nicht nur als
Build-Variablen. Die letzten drei sind verschlüsselte Secrets. Es gibt absichtlich keine
Zugangsdaten in der `wrangler.toml`.

Der Worker setzt eine signierte, sieben Tage gültige Session in einem `HttpOnly`, `Secure`, `SameSite=Strict` Cookie. OpenAI wird ausschließlich über `/api/ai` vom Worker aufgerufen. Der API-Key und das Passwort werden weder an den Browser geschickt noch in LocalStorage gespeichert.

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
