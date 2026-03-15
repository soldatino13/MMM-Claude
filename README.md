# MMM-Claude

MagicMirror² Modul für Claude AI — Chat-Interface direkt auf dem Spiegel mit eingebetteter Tastatur.

## Features

- 💬 Touch-optimiertes Chat-UI mit Bubble-Design
- ⌨️ Eingebettete DE/CH Tastatur (klappt inline auf, keine externe Abhängigkeit)
- 🔢 Buchstaben- und Zahlen-/Sonderzeichen-Layout
- ✦ Anthropic Claude API (konfigurierbares Modell)
- 🌍 Optionale Websuche via `enableWebSearch: true`
- 📅 Aktuelles Datum automatisch in jeden API-Call injiziert
- 🌑 Mirror-optimiertes Dark-Theme (violett/lila Akzente)
- ✍️ Markdown-Rendering in Antworten (fett, kursiv, Listen)
- 🔄 Session-only Verlauf (kein persist über Neustarts)

## Voraussetzungen

- MagicMirror² installiert
- Anthropic API Key: https://console.anthropic.com/

Keine weiteren Abhängigkeiten — kein `npm install` nötig.

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/soldatino13/MMM-Claude.git
```

## Konfiguration in `config.js`

```js
{
  module: "MMM-Claude",
  position: "bottom_center",
  classes: "day_scheduler16",
  config: {
    apiKey: "sk-ant-...",       // ← Anthropic API Key
    model: "claude-haiku-4-5",  // Günstigste Option, reicht für Mirror-Nutzung
    maxTokens: 1024,
    enableWebSearch: true,      // Websuche aktivieren (optional)
    systemPrompt: "Du bist Claude, ein hilfreicher Assistent auf einem MagicMirror. Antworte kurz und klar.",
    fontSize: "16px",
    title: "Claude AI",
    placeholder: "Tippe hier...",
  }
},
```

> **Hinweis zu `classes`:** Mit `day_scheduler16` (MMM-pages) verschwindet das Modul beim Seitenwechsel. Mit `day_scheduler` bleibt es permanent in `bottom_right` sichtbar — analog zu Wetter und Sonos.

### Alle Config-Optionen

| Option | Default | Beschreibung |
|---|---|---|
| `apiKey` | `""` | Anthropic API Key (sk-ant-...) |
| `model` | `"claude-opus-4-5"` | Claude Modell (`claude-haiku-4-5` = günstiger) |
| `maxTokens` | `1024` | Max. Tokens pro Antwort |
| `systemPrompt` | (s.o.) | Systemkontext für Claude |
| `enableWebSearch` | `false` | Websuche aktivieren (kostet mehr Tokens) |
| `fontSize` | `"16px"` | Schriftgrösse des Moduls |
| `title` | `"Claude AI"` | Header-Titel |
| `placeholder` | `"Tippe hier..."` | Placeholder-Text im Eingabefeld |

> **Hinweis:** Das heutige Datum wird automatisch vom Server in den systemPrompt injiziert — Claude kennt das Datum immer ohne manuelle Angabe.

## Bedienung

| Aktion | Funktion |
|---|---|
| Tap auf Eingabefeld | Tastatur aufklappen |
| `⇧` | Shift — nächster Buchstabe gross, dann auto-zurück |
| `⌫` | Letztes Zeichen löschen |
| `↵ Senden` | Nachricht senden + Tastatur zuklappen |
| `123` / `ABC` | Wechsel zwischen Buchstaben und Zahlen/Sonderzeichen |
| `✕` (oben rechts) | Chat-Verlauf löschen |

## Tastatur-Layout (DE/CH)

```
┌─────────────────────────────────────────┐
│  q  w  e  r  t  z  u  i  o  p   ⌫      │
│  a  s  d  f  g  h  j  k  l  ä   ↵      │
│  ⇧  y  x  c  v  b  n  m  ö  ü   ⇧      │
│  123      Leertaste        .            │
└─────────────────────────────────────────┘
```

## Markdown in Antworten

Claude-Antworten werden mit einfachem Markdown gerendert:

| Markdown | Darstellung |
|---|---|
| `**fett**` | **fett** |
| `*kursiv*` | *kursiv* |
| `- Listenpunkt` | • Listenpunkt |

## Datei-Struktur

```
MMM-Claude/
├── MMM-Claude.js     ← Frontend Modul + eingebettete Tastatur + Markdown
├── node_helper.js    ← Backend (Anthropic API via Node.js https)
├── MMM-Claude.css    ← Styling
├── package.json
├── LICENSE
└── README.md
```

## API Key sicher aufbewahren

Den Key niemals in git committen. Empfohlene Varianten:

**Option A** — Direkt in `config.js` (lokal, nicht ins Repo gepusht):
```js
apiKey: "sk-ant-api03-..."
```

**Option B** — Umgebungsvariable (dann `node_helper.js` anpassen):
```js
apiKey: process.env.ANTHROPIC_KEY
```
