# 🎨 Kie.ai MCP Server — Self-Hosted Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-1.x-blue)](https://modelcontextprotocol.io)
[![Transport](https://img.shields.io/badge/transport-stdio%20%7C%20streamable--http-green)](#-schnellstart)
[![Deploy](https://img.shields.io/badge/deploy-Coolify%20%7C%20Docker-8b5cf6)](#-self-hosting-mit-coolify-empfohlen)
[![AI Tools](https://img.shields.io/badge/AI_tools-28-orange)](#-was-du-bekommst)

[🇬🇧 English](README.md) · [🇩🇪 Deutsch](README.de.md)

**Ein MCP-Server für State-of-the-Art-KI-Generierung — Video, Bilder, Musik, Audio — auf _deinem eigenen_ Server.**

Das ist eine self-hostbare Variante des Kie.ai-MCP-Servers: dieselben 28 KI-Tools, plus einen **Remote-Transport über Streamable HTTP**, damit du ihn auf deiner eigenen Infrastruktur deployen (Coolify-first), von überall erreichen und API-Key wie Daten auf deinem eigenen Server behalten kannst.

---

## ⚡ Worum geht's

Der ursprüngliche [kie-ai-mcp-server von felores](https://github.com/felores/kie-ai-mcp-server) ist ein hervorragender stdio-MCP-Server — er läuft lokal als Subprozess deines KI-Clients. Dieser Fork ergänzt genau das, was du brauchst, um ihn **als Dienst zu betreiben**:

- 🌐 **Remote-Transport (Streamable HTTP)** — über das Netzwerk erreichbar, nicht nur lokal
- 🔐 **Bearer-Token-Auth** — nur du verbrauchst deine Credits
- 🐳 **Docker- & Coolify-Deploy** — ein Compose-File, automatisches HTTPS
- ♻️ **Dual-Transport** — `stdio` bleibt Standard, lokale Nutzung bricht nicht

Ideal als erster MCP hinter einem self-gehosteten Gateway wie [MetaMCP](https://github.com/metatool-ai/metamcp) oder [MCPJungle](https://github.com/mcpjungle/MCPJungle).

## 🎯 Architektur

```
   Claude Desktop / Cursor / claude.ai
                │  Bearer-Token
                ▼
        MCP-Gateway (MetaMCP)            ← ein Endpoint für alle deine MCPs
                │
                ▼
   ┌─────────────────────────────┐
   │  kie-ai-mcp  (dieser Server)│      ← dein Coolify-Service
   │  Streamable HTTP  →  /mcp    │         • /health für Coolify
   │  SQLite-Task-DB   →  /data   │         • dein KIE_AI_API_KEY
   └─────────────────────────────┘
                │
                ▼
            Kie.ai API  (Veo3, Nano Banana, Suno, …)
```

## 🚀 Schnellstart

Zwei Wege — wähle einen.

| Modus | Wann | Wie |
|-------|------|-----|
| 🐳 **Self-hosted (HTTP)** | Von überall erreichbar, hinter einem Gateway, auf deinem Server | [Coolify-Deploy ↓](#-self-hosting-mit-coolify-empfohlen) |
| 💻 **Lokal (stdio)** | Schnelle lokale Nutzung in einem Client | [npx-Konfiguration ↓](#-lokale-nutzung-stdio) |

---

## 🐳 Self-Hosting mit Coolify (empfohlen)

Direkt aus diesem Repo deployen. Coolify baut das Image und stellt HTTPS bereit.

**1. Neue Ressource** → Coolify → dein Projekt → **+ New Resource → Docker Compose**

**2. Auf dieses Repo zeigen**

| Einstellung | Wert |
|-------------|------|
| Repository | `https://github.com/oliverhees/kie-ai-mcp-server.git` |
| Branch | `main` |
| Compose-File | `docker-compose.coolify.yml` |

**3. Umgebungsvariablen setzen**

```bash
SERVICE_FQDN_KIEAIMCP_3000=kie-mcp.deine-domain.tld   # deine Subdomain — Coolify ergänzt TLS
KIE_AI_API_KEY=dein-kie-ai-api-key                    # von https://kie.ai/api-key
MCP_AUTH_TOKEN=$(openssl rand -hex 32)                # geheimes Bearer-Token — siehe Hinweis
```

> ⚠️ **Setze immer `MCP_AUTH_TOKEN`.** Ohne ist der `/mcp`-Endpoint **offen**, und jeder mit der URL kann deine Kie.ai-Credits verbrauchen. Token erzeugen mit `openssl rand -hex 32`.

**4. Deploy.** Der Build kompiliert das native `sqlite3`-Addon (~1–2 Min) und holt anschließend ein TLS-Zertifikat.

**5. Verifizieren**

```bash
curl https://kie-mcp.deine-domain.tld/health
# → {"status":"ok","transport":"streamable-http","sessions":0}
```

Die SQLite-Task-Historie liegt auf dem `/data`-Volume und überlebt damit Redeploys.

### 🔌 Client anbinden

| Client | URL | Auth |
|--------|-----|------|
| **claude.ai** (Custom Connector) | `https://kie-mcp.deine-domain.tld/mcp` | Bearer `MCP_AUTH_TOKEN` |
| **Claude Desktop / Cursor** | gleiche URL (über Streamable HTTP / `mcp-remote`) | `Authorization: Bearer …` |
| **MetaMCP / MCPJungle** | als Streamable-HTTP-Server registrieren, gleiche URL + Token | Bearer `MCP_AUTH_TOKEN` |

---

## 💻 Lokale Nutzung (stdio)

Für die schnelle lokale Nutzung bleibt der ursprüngliche stdio-Modus unverändert — einfach zur MCP-Client-Konfiguration hinzufügen:

```json
{
  "mcpServers": {
    "kie-ai": {
      "command": "npx",
      "args": ["-y", "@felores/kie-ai-mcp-server"],
      "env": { "KIE_AI_API_KEY": "dein-api-key" }
    }
  }
}
```

Funktioniert mit Claude Desktop, Cursor, Windsurf, VS Code, Claude Code und mehr.

---

## ⚙️ Konfiguration

### Transport (remote vs. lokal)

| Variable | Standard | Zweck |
|----------|----------|-------|
| `MCP_TRANSPORT` | `stdio` | `stdio` (lokal) oder `http` (remote Streamable HTTP) |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | HTTP-Bindung (http-Modus) |
| `MCP_AUTH_TOKEN` | — | Bearer-Token; **bei öffentlichem Betrieb setzen** |
| `MCP_HTTP_PATH` | `/mcp` | Pfad des MCP-Endpoints |
| `MCP_CORS_ORIGIN` | `*` | CORS-Origin für Browser-Clients (claude.ai) |

### Kie.ai

| Variable | Standard | Zweck |
|----------|----------|-------|
| `KIE_AI_API_KEY` | — | **Pflicht.** Von [kie.ai/api-key](https://kie.ai/api-key) |
| `KIE_AI_DB_PATH` | `~/.kie-ai/tasks.db` | SQLite-Pfad. In Docker: `/data/tasks.db` (Volume) |
| `KIE_AI_CALLBACK_URL` | — | Optionale öffentliche Callback-URL für asynchrone Tasks |

### Tool-Filterung

Weniger Rauschen — aktiviere nur die Tools, die du nutzt:

```bash
KIE_AI_ENABLED_TOOLS="nano_banana_image,veo3_generate_video,suno_generate_music"  # Whitelist
KIE_AI_TOOL_CATEGORIES="image,video"                                              # nach Kategorie
KIE_AI_DISABLED_TOOLS="midjourney_generate,runway_aleph_video"                    # Blacklist
```

Priorität: `ENABLED_TOOLS` > `TOOL_CATEGORIES` > `DISABLED_TOOLS` > alle. Utility-Tools (`list_tasks`, `get_task_status`) sind immer aktiv.

---

## 🎨 Was du bekommst

**28 vereinheitlichte KI-Tools** über Bild, Video und Audio — Veo 3, Nano Banana 2, Suno V5, ElevenLabs, ByteDance Seedance/Seedream, Qwen, GPT Image 2, Flux Kontext, Wan 2.7, Hailuo, Kling, Midjourney, Runway Aleph, Topaz, Recraft, Ideogram und mehr. Jedes Tool erkennt den Modus automatisch (Generieren / Bearbeiten / Hochskalieren in einem).

**→ [Komplette Tool-Referenz](docs/TOOLS.md)** · [Datenbank & Tasks](docs/DATABASE.md) · [Admin-Konfiguration](docs/ADMIN.md)

## 🔑 Kern-Features

- 🌐 **Remote-fähig** — Streamable-HTTP-Transport mit Sessions
- 🔐 **Auth eingebaut** — Bearer-Token-Schutz, offener `/health` für Healthchecks
- 🐳 **Coolify-/Docker-Deploy** — Multi-Stage-Image, persistentes DB-Volume
- 🎯 **Ein API-Key** für alle Modelle · 🔄 **SQLite-Task-Tracking**, das Neustarts überlebt
- 🧠 **Smarte Kostenkontrolle** — wählt standardmäßig die günstigste Stufe, außer du forderst Qualität

## 🆘 Fehlerbehebung

**`401` auf `/mcp`** — dein Client sendet kein `Authorization: Bearer <MCP_AUTH_TOKEN>`, oder das Token passt nicht.

**Coolify-Build schlägt fehl** — prüfe, ob der Compose-Pfad `docker-compose.coolify.yml` und der Branch korrekt ist. Das `sqlite3`-Addon braucht die Build-Tools der Build-Stage (im Dockerfile bereits enthalten).

**`/health` antwortet direkt nach dem Deploy nicht** — der Server braucht ~1–4 s zum Hochfahren (große Tool-Registry). Der `start_period` des Healthchecks deckt das ab; einfach einen Moment warten.

---

## 🙏 Credits

- **[felores/kie-ai-mcp-server](https://github.com/felores/kie-ai-mcp-server)** — der ursprüngliche MCP-Server und alle 28 KI-Tools. Diese Edition ergänzt nur den Remote-/Self-Hosting-Layer.
- **[Kie.ai](https://kie.ai)** — die vereinheitlichte KI-Generierungs-API.
- **[Model Context Protocol](https://modelcontextprotocol.io)** — der offene Standard, auf dem das aufbaut.

## 👋 Über uns — Aiianer

Self-Hosting-Layer gebaut und gepflegt von **Oliver Hees** (alias **Aiianer**) — wir bauen Tools, Kurse und Content für die deutschsprachige KI-Builder-Community.

Wenn dir das beim Self-Hosting deiner eigenen KI-Tools geholfen hat, sag am besten so danke — komm vorbei:

[![Skool Community](https://img.shields.io/badge/Skool-Aiianer_Community-purple?style=for-the-badge&logo=skool)](https://skool.com/aiianer)
[![YouTube](https://img.shields.io/badge/YouTube-%40aiianer-red?style=for-the-badge&logo=youtube)](https://youtube.com/@aiianer)
[![Website](https://img.shields.io/badge/Website-aiianer.de-blue?style=for-the-badge&logo=safari)](https://aiianer.de)

- 🎓 **[Skool Community](https://skool.com/aiianer)** — Kurse, Deep-Dives und eine Community von Buildern
- 📺 **[YouTube](https://youtube.com/@aiianer)** — Tutorials und Walkthroughs
- 🌐 **[Website](https://aiianer.de)** — alles andere

## 📄 Lizenz

[MIT](LICENSE) — mach damit, was du willst, aber gib mir nicht die Schuld, wenn's kaputtgeht.

Wenn du es forkst oder etwas darauf aufbaust, ist ein Backlink zu diesem Repo oder ein Shoutout an [@aiianer](https://aiianer.de) willkommen, aber nicht erforderlich. Original-Tools © [felores](https://github.com/felores/kie-ai-mcp-server).

---

**Made with 💛 in Germany · [aiianer.de](https://aiianer.de)**
