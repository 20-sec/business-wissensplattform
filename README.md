## GitHub Pages – öffentliche Testversion

URL: https://20-sec.github.io/business-wissensplattform/

Die Startseite fragt das bisherige Passwort ab. Diese Browser-Abfrage ist kein Zugriffsschutz für das öffentliche Repository oder direkte Dateien. Diese Einschränkung wurde für den Test ausdrücklich akzeptiert. Plattformseiten haben noindex; Suchmaschinen müssen diese Bitte beachten, sie ist keine Zugriffsbarriere. Originaldateien bleiben bytegleich.

Aktualisieren: lokalen Server starten, Build ausführen, `node scripts/export-pages.mjs`, prüfen, committen und pushen. Der Workflow veröffentlicht nur `pages-export/`. Keine Server-Geheimnisse gelangen in den Export; er enthält lediglich einen gesalzenen Passwort-Prüfwert. Die bisherige Sites-Adresse wird nicht mehr aktualisiert; ihre Löschung ist mangels Löschfunktion noch offen.

# Business-Wissensplattform

Private Wissensdatenbank für analysierte Business-Videos von Markus Coenen: Modelle validieren, Erkenntnisse verdichten und Tools sowie Anleitungen für spätere Projekte oder das Netzwerk sammeln. Ein Import ist keine persönliche Umsetzungsabsicht. Stand: lokaler erster Prototyp mit importierten und gegengeprüften HTML-Analysen; ohne Onlineveröffentlichung.

## Enthalten
- Passwortzugang mit serverseitiger Prüfung, signierter 12-Stunden-Sitzung und HttpOnly-Cookie.
- Übersicht mit Suche, Kategorien, Prüfstatus und echten Leerzuständen.
- Geschützte Original-HTML-Ansicht im Sandbox-Iframe; kein Zugriff über public.
- Unveränderte mitgelieferte Bewertung sowie getrennte Gegenprüfungen mit Quellen, Aussagengewichten, Rückfragen und persönlicher Relevanz.
- Append-only-Prüfstände und Themenfassungen mit konkreten Quellenrevisionen.
- Import mit Hash-Duplikatprüfung und Prüfaufträgen bei gemeinsamen Tags/Themen.

## Lokal starten
Node gemäß package.json. `npm run install:ci`, anschließend `npm run dev -- --host 127.0.0.1`.
Die lokale Vorschau startet standardmäßig unter http://localhost:5173. `.dev.vars` enthält APP_PASSWORD und SESSION_SECRET und wird nicht eingecheckt. Die Datei existiert im eingerichteten Projekt bereits. Auf einem frischen Checkout beide Werte in `.dev.vars` setzen; Namen siehe `.env.example`. Ohne beide Werte bleibt der Zugang gesperrt. Nur für lokalen Betrieb ohne HTTPS vorgesehen; Onlinebetrieb erfordert HTTPS und einen dauerhaften Login-Limiter. Der aktuelle Limiter gilt pro Serverinstanz.

## Arbeiten mit HTML-Analysen
1. HTML-Datei im gemeinsamen Codex-Task hochladen. Optional im ignorierten Ordner `data/inbox` ablegen.
2. Codex liest und kategorisiert den Inhalt und erstellt Metadaten nach `docs/import-beispiel.json`. `sourceAssessment` enthält die bereits vorhandene Bewertung wörtlich. Fehlende Bewertung: null. Videotitel, URL und Kanal aus dem Material übernehmen.
3. `npm run catalog -- import /absolut/analyse.html /absolut/metadaten.json`
4. Recherche- und Gegenprüfungsagent prüfen die entscheidenden Aussagen nach `docs/BEWERTUNGSMETHODIK.md`. Die Webseite selbst startet keine Agenten und keine laufende Überwachung.
5. Vollständige neue Revision nach `lib/schema.mjs` erstellen, mit `npm run catalog -- review video-id /absolut/revision.json` anhängen. Das ist eine fachliche Tätigkeit, keine automatische Übernahme eines fremden Ratings.
6. Dauerhafte Themen vor Verwendung mit `npm run catalog -- topic /absolut/thema.json` anlegen (initial mit leerer revisions-Liste möglich). Themenseiten sind unter `/themen/id` erreichbar und von zugehörigen Analysen verlinkt.
7. `npm run catalog -- validate`, `npm test`, `npm run build` und Git-Commit.

Daten liegen versioniert in `data/catalog.json`, Originalbytes unverändert in `data/originals/<sha256>.html`. `data/content.json` ist der private serverseitige HTML-Index für die erste kleine Sammlung. Die Dateien dürfen nicht nach public verschoben werden. Bei wachsender Sammlung Umstieg auf Datenbank und geschützten Objektspeicher: aktuell werden Originale in den Serverbuild aufgenommen. Der CLI-Import serialisiert Schreibzugriffe und schreibt die Katalogdatei atomar. Ein abgebrochener Import kann ein unreferenziertes Original hinterlassen, aber keine alte Bewertung überschreiben.

## Prüfungen
`npm test` prüft Originalerhalt, Duplikate, Revisionsketten, Referenzen und Gewichtung mit isolierten Testdaten. `node scripts/check-access.mjs http://localhost:5173` prüft Anmeldung, geschützte Routen, Cookie-Eigenschaften, Fälschungen und Abmeldung ohne das Passwort auszugeben. Browserdarstellung wurde bisher nicht visuell geprüft.

## Nächste Schritte
Weitere HTML-Analysen importieren und gemeinsam Einordnung/Bewertung anhand des ersten KDP-Eintrags prüfen. Danach Hosting und Datenhaltung auswählen und die geschützte Onlineversion bereitstellen. Noch kein GitHub-Remote, kein Deployment, keine dauerhaft laufende Automatisierung eingerichtet.
