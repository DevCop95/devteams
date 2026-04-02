# Dev Teams · AI Operations Hub

![Status](https://img.shields.io/badge/status-alpha-0fa855?style=for-the-badge)
![Build](https://img.shields.io/badge/build-static_app-111111?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge&logo=threedotjs&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-llama_4_%2F_kimi_k2-f55036?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

An interactive 3D office with eight AI agents. With a modular, clean architecture, it runs in demo mode with no credentials and scales to real responses as soon as you connect a Groq API key.

---

## Overview

![Cover](docs/screenshots/portada-repo.png)

---

## What’s included

### 3D Scene
- Eight agents with their own personality, role, and work area: Ana (CEO), Sofía (PM), Yared (Founder & Architect), Diego (FE), Marta (QA), Luis (DevOps), Valentina (UX), and Andrés (Data)
- A* pathfinding with Web Worker
- Dynamic shadows, day/night cycle, FPS mode, real Cartagena weather via Open-Meteo
- Environmental events: delivery, breaks, ping pong, visitor Paula

### Side panel
- **Tree** — team hierarchy with real-time status
- **Flow** — MCP steps per agent with token and cost metrics
- **Console** — individual chat or smart broadcast
- **Status** — global activity with 60-second chart
- **Dashboard** — executive KPIs, shared decisions, and operational health

### Chat and multi-agent behavior
- Automatic routing to the most relevant agent per topic
- Internal planner for complex queries
- Delegation between roles with flow arrows
- Automatic memory compression as history grows
- Broadcast mode: selects the right roles instead of blasting everyone

### Workspace (File System Access API)
- Connect to a local folder without uploading anything to any server
- Read `.txt`, `.md`, `.json`, `.js`, `.ts`, PDF, Excel, and Word
- Plain-text search across the project
- File analysis by active role using Groq

---

## How to run

Any local static server works. The quickest option:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

You can also use Live Server, Vite, `npx serve`, or any equivalent.

> **Note:** for workspace commands (`/carpeta`, `/leer`, etc.) you need a Chromium-based browser. Firefox does not support `showDirectoryPicker` yet.

---

## Connect Groq

1. Open the app and click the **API** button in the header.
2. Choose the model from the selector.
3. Paste your API key (you can get one for free at [console.groq.com](https://console.groq.com)).
4. Click **Save**.

The app validates the key with a real call before confirming the connection. If it fails, it automatically falls back to demo mode. The key is stored in `sessionStorage` and never touches any custom backend.

### Available models

| Identifier | Description |
|---|---|
| `llama-3.3-70b-versatile` | Balanced default |
| `llama-3.1-8b-instant` | Faster responses |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | Stronger reasoning |
| `moonshotai/kimi-k2-instruct-0905` | 256K context |
| `groq/compound` | Real-time search |

---

## Chat commands

Type any of these directly into the console input:
/carpeta Connect a local folder
/indexar Rebuild the file index
/archivos List detected files
/leer path Read a file and open it in the viewer
/buscar text Search for matches in the workspace
/analizar path Analyze a file with Groq using the active role
/exportar Download the current chat as .txt


The small tools menu in the console exposes the same actions without having to type commands.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Next step in the flow |
| `R` | Reset simulation |
| `M` | Start team meeting |
| `F` | Enter / exit FPS mode |
| `N` | Toggle day / night |
| `A` | Auto-play active flow |
| `C` | Reset camera |
| `?` | Show shortcuts |
| `Esc` | Close modals / exit FPS |

---

## Project structure

```text
.
├── index.html          # HTML structure and UI containers
├── css/
│   └── styles.css      # All visual styles (layout, animations)
├── js/
│   ├── main.js         # Entry point and initialization
│   └── modules/
│       ├── api.js         # Groq logic, prompts, and planner
│       ├── audio.js       # Sound effects and generative music
│       ├── scene.js       # Three.js engine, lights, and weather
│       ├── navigation.js  # A* pathfinding system
│       ├── workspace.js   # Local file access (PDF, Office, TXT)
│       ├── agents.js      # Agents, sub-agents, and visitors logic
│       └── ui.js          # Dashboard, modals, console, and status
└── README.md
```

The app has been refactored to be modular and maintainable. There is no build step, no npm dependencies, and no backend. Everything you need lives in the modules and the CDNs declared in `index.html`.

---

## Stack

- **Three.js r128** — 3D scene, materials, lights, and shadows
- **Chart.js 4** — metrics in the status panel
- **PDF.js** — local PDF file reading
- **SheetJS (xlsx)** — spreadsheet reading
- **Mammoth.js** — text extraction from Word files
- **Groq API** — LLM inference (llama 4, kimi k2, and others)
- **File System Access API** — local folder access without uploading files
- **Web Workers** — A* pathfinding off the main thread
- **Web Speech API** — voice input in the console

---

## Persistence

| Data | Where it’s stored |
|---|---|
| API key | `sessionStorage` (does not persist between sessions) |
| Selected model | `localStorage` |
| Per-agent chat history | `localStorage` |
| Meeting history | `localStorage` |
| Task history | `localStorage` |
| XP and levels | `localStorage` |
| Achievements | `localStorage` |
| Whiteboard notes | `localStorage` |
| Shared decisions | `localStorage` |

---

## Security & privacy

This version is designed for local use and demos. For production or networked environments:

- Calls to Groq are made directly from the browser. In a public setting, move those calls to a backend so you don’t expose your key.
- Workspace files never leave the browser. Reading is fully local.
- No telemetry or data is sent to any custom service.

---

## Known limitations

- FPS mode with pointer lock can behave differently depending on the browser.
- Some visitor flows (delivery, Paula) are still under iteration and may need fine-tuning.
- Chat memory compression is automatic but not perfect for very long conversations.

---

## Credits

Built from scratch in Cartagena de Indias 🇨🇴 by **Yared Henriquez**, Founder & Architect at Dev Teams.

---

## License

MIT.[web:96]
