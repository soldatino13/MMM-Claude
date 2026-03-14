# MMM-Claude

MagicMirror² Modul für Claude AI — Chat-Interface direkt auf dem Spiegel.  
Integriert mit **MMM-Keyboard** (lavolp3) für Touch-Eingabe.

## Features

- 💬 Chat-UI mit Touch-optimiertem Eingabefeld
- ⌨️ MMM-Keyboard Integration (kein eigenes Keyboard-Overlay)
- ✦ Anthropic Claude API (konfigurierbares Modell)
- 🌑 Mirror-optimiertes Dark-Theme (violett/lila Akzente)
- 🔄 Session-only Verlauf (kein persist über Neustarts)

## Voraussetzungen

- MagicMirror² installiert
- [MMM-Keyboard](https://github.com/lavolp3/MMM-Keyboard) installiert und aktiv

## Installation

```bash
cd ~/MagicMirror/modules
# Ordner reinkopieren oder:
git clone https://github.com/soldatino13/MMM-Claude.git
```

Kein `npm install` nötig — verwendet nur Node.js built-in `https`.

## Konfiguration in `config.js`

```js
{
  module: "MMM-Claude",
  position: "bottom_right",   // oder jede andere MagicMirror-Position
  config: {
    apiKey: "sk-ant-...",     // ← Anthropic API Key
    model: "claude-opus-4-5",
    maxTokens: 1024,
    systemPrompt: "Du bist Claude, ein hilfreicher Assistent auf einem MagicMirror. Antworte kurz und klar.",
    fontSize: "16px",
    title: "Claude AI",
    placeholder: "Tippe hier...",
  }
},
```

### Alle Config-Optionen

| Option | Default | Beschreibung |
|---|---|---|
| `apiKey` | `""` | Anthropic API Key (sk-ant-...) |
| `model` | `"claude-opus-4-5"` | Claude Modell |
| `maxTokens` | `1024` | Max. Tokens pro Antwort |
| `systemPrompt` | (s.o.) | Systemkontext für Claude |
| `fontSize` | `"16px"` | Schriftgrösse des Moduls |
| `title` | `"Claude AI"` | Header-Titel |
| `placeholder` | `"Tippe hier..."` | Placeholder-Text |

## MMM-Keyboard Integration

Das Modul kommuniziert mit MMM-Keyboard über MagicMirror-Notifications:

| Notification | Richtung | Bedeutung |
|---|---|---|
| `SHOW_KEYBOARD` | → Keyboard | Keyboard einblenden (bei Tap auf Eingabefeld) |
| `HIDE_KEYBOARD` | → Keyboard | Keyboard ausblenden (nach Absenden) |
| `KEYBOARD_INPUT` | ← Keyboard | Aktueller Eingabetext + Tastendruck |
| `KEYBOARD_CLOSED` | ← Keyboard | Keyboard geschlossen (optional) |

MMM-Keyboard muss mit `key: "MMM-Claude"` konfiguriert sein, damit die Eingaben
nur an dieses Modul weitergeleitet werden:

```js
// MMM-Keyboard Konfiguration (Beispiel):
{
  module: "MMM-Keyboard",
  config: {
    // Die Keys entsprechen den Modul-IDs die das Keyboard nutzen
    // MMM-Bring und MMM-Claude nutzen unterschiedliche Keys
  }
}
```

## Datei-Struktur

```
MMM-Claude/
├── MMM-Claude.js       ← Frontend Modul (MagicMirror API)
├── node_helper.js      ← Backend (Anthropic API via https)
├── MMM-Claude.css      ← Styling
├── package.json
└── README.md
```

## API Key

Anthropic API Keys: https://console.anthropic.com/

Den Key niemals in git committen — entweder:
- Direkt in `config.js` (lokal, nicht gepusht)
- Oder als Umgebungsvariable über `process.env.ANTHROPIC_KEY` (dann `node_helper.js` anpassen)
