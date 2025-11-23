# 252425-Wetter

Modernes, rein statisches Wetter-Dashboard auf Basis der Open‑Meteo APIs. Zeigt aktuelle Bedingungen, 7‑Tage‑Trend, stündliche Grafik, Luftqualität und astronomische Daten für beliebige Städte in deutscher Sprache.

- **Live-Demo:** `wetter.252425.xyz`
- **Tech-Stack:** HTML, CSS, Vanilla JS, Lucide Icons, Open‑Meteo Weather & Air-Quality APIs

## Features
- Städtensuche mit sofortigem Laden der Daten
- Aktuelle Werte: Temperatur, gefühlt, Luftfeuchte, Wind, Böen, Druck, Bewölkung, Sichtweite, UV-Index
- Precip/Schnee-Badges und Luftqualitätswerte (EU AQI, PM2.5)
- 7‑Tage‑Vorhersage mit Icons und Regen-/Schnee-Wahrscheinlichkeiten
- Stündlicher Temperatur- und Niederschlagschart (nächste 24h)
- Sonnenaufgang/-untergang mit Tag/Nacht-Hinweis
- Freundliche Fehleranzeige und Ladezustand

## Nutzung
1) Repository klonen oder herunterladen.  
2) `index.html` im Browser öffnen – keine Build-Schritte oder API-Keys nötig.  
   - Optional: mit einem lokalen Static-Server (z. B. `python -m http.server 8000`) starten, falls der Browser strenge CORS-Datei-Regeln hat.

## Deployment & Domain
- Für statisches Hosting (z. B. GitHub Pages) einfach den `main`-Branch veröffentlichen.
- Custom Domain: Die Datei `CNAME` verweist auf `wetter.252425.xyz`. Bei Forks oder anderer Domain den Eintrag in `CNAME` anpassen.

## Datenquellen
- Open‑Meteo Geocoding & Forecast API
- Open‑Meteo Air-Quality API
