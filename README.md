<img src="https://github.com/AtomicBot-ai/.github/raw/main/assets/logo.png" width="80" alt="Atomic" />

# ClawHub Layer API

The complete REST API for [ClawHub](https://clawhub.com) — 36,000+ skills with full data the official API doesn't expose.

<a href="https://github.com/AtomicBot-ai/clawhub-layer-api/stargazers"><img src="https://img.shields.io/github/stars/AtomicBot-ai/clawhub-layer-api?style=flat&logo=github&label=Stars&color=f5c542" alt="Stars" /></a>&nbsp;
<a href="https://github.com/AtomicBot-ai/clawhub-layer-api/network/members"><img src="https://img.shields.io/github/forks/AtomicBot-ai/clawhub-layer-api?style=flat&logo=github&label=Forks&color=4ac1f2" alt="Forks" /></a>&nbsp;
<a href="https://github.com/AtomicBot-ai/clawhub-layer-api/commits/main"><img src="https://img.shields.io/github/last-commit/AtomicBot-ai/clawhub-layer-api?style=flat&label=Last%20Commit&color=blueviolet" alt="Last Commit" /></a>&nbsp;
<img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS" />&nbsp;
<img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" />&nbsp;
<img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" />

<a href="https://clawhub.atomicbot.ai/docs"><img src="https://img.shields.io/badge/Swagger-API_Docs-85ea2d?style=flat&logo=swagger&logoColor=white" alt="Swagger" /></a>&nbsp;
<a href="https://clawhub.atomicbot.ai/docs-json"><img src="https://img.shields.io/badge/OpenAPI-JSON-6ba539?style=flat&logo=openapiinitiative&logoColor=white" alt="OpenAPI JSON" /></a>&nbsp;
<a href="https://clawhub.atomicbot.ai"><img src="https://img.shields.io/badge/Live-clawhub.atomicbot.ai-blue?style=flat" alt="Live API" /></a>

---

### Why?

The official ClawHub API is limited — no full-text search, no security scan results, no file contents, no moderation data. To get the full picture you'd need to query their Convex database directly.

**ClawHub Layer API** pulls the complete catalog from ClawHub's Convex DB, caches it in MongoDB, and serves it as a clean, fast REST API.

---

### Try It Now

**Live API** — [clawhub.atomicbot.ai](https://clawhub.atomicbot.ai/api/skills)

**API Docs** - [swagger](https://clawhub.atomicbot.ai/docs)

**OpenAPI Spec** — [clawhub.atomicbot.ai/docs-json](https://clawhub.atomicbot.ai/docs-json) — feed it to your coding agent to unleash full API access.

---

### What You Get

- 📦 **Complete catalog** — all 36,000+ skills with stats, versions, tags, and ownership
- 🔍 **Full-text search** — weighted search across slug, name, and description
- 🛡️ **Security data** — VirusTotal scan results and LLM-based analysis
- 🚩 **Moderation info** — suspicious/malicious flags, removal status, reason codes
- 📄 **File contents** — read any file from any skill (SKILL.md, configs, source code)
- 💬 **Comments** — live comment threads with user profiles
- 🔀 **Fork tracking** — fork/duplicate relationships between skills
- 🔄 **Auto-sync** — configurable cron keeps your data fresh
- ⚡ **On-demand enrichment** — detail data fetched and cached on first request
- 📖 **Swagger UI** — interactive API docs at `/docs`

---

### Quick Start

```bash
git clone https://github.com/AtomicBot-ai/clawhub-layer-api.git
cd clawhub-layer-api
docker compose -f docker-compose.prod.yml up -d
```

API at `http://localhost:3000` · Swagger at `http://localhost:3000/docs`

Or use the public instance: **[clawhub.atomicbot.ai/docs](https://clawhub.atomicbot.ai/docs)**

Trigger initial sync:

```bash
docker compose -f docker-compose.prod.yml exec app node dist/cli sync
```

---

### API

#### List Skills

```
GET /api/skills?page=1&limit=25&sort=downloads&dir=desc&nonSuspiciousOnly=true
```

| Param | Values | Default |
|-------|--------|---------|
| `sort` | `downloads` · `stars` · `installs` · `updated` · `newest` · `name` | `downloads` |
| `dir` | `asc` · `desc` | `desc` |
| `limit` | `1–200` | `25` |
| `nonSuspiciousOnly` | `true` · `false` | `false` |

#### Search

```
GET /api/skills/search?q=summarize&limit=25
```

Weighted full-text search: slug (×10), name (×5), summary (×1).

#### Skill Detail

```
GET /api/skills/:slug
```

Returns the complete skill record: metadata, latest version, owner, file list, security analysis (VT + LLM), moderation status, fork info, and SKILL.md content. Cached in MongoDB, re-fetched if stale.

#### File Content

```
GET /api/skills/:slug/files?path=SKILL.md
```

Returns raw file content for any file in the skill package.

#### Comments

```
GET /api/skills/:slug/comments?limit=50
```

Live comments from ClawHub with user profiles.

#### Health

```
GET /health
```

---

### How Sync Works

```
ClawHub Convex DB ──▶ Layer API (MongoDB) ──▶ Your App
       ▲                      │
       └── cron / on-demand ──┘
```

1. **Bulk sync** (cron) — pages through the entire ClawHub catalog via `listPublicPageV4`, upserting into MongoDB. ~36k skills in ~2-3 minutes.
2. **Detail enrichment** (on-demand) — when `GET /api/skills/:slug` is called, full detail is fetched from `getBySlug` and cached with a configurable TTL.
3. **File caching** — file contents are fetched from ClawHub's site API and cached in MongoDB with the same TTL.

---

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/clawhub-layer` | MongoDB connection |
| `CONVEX_CLOUD_URL` | `https://wry-manatee-359.convex.cloud` | ClawHub Convex query endpoint |
| `CONVEX_SITE_URL` | `https://wry-manatee-359.convex.site` | ClawHub site HTTP API |
| `SYNC_CRON` | `0 */3 * * *` | Sync schedule (default: every 3 hours) |
| `CACHE_TTL_HOURS` | `3` | TTL for detail/file cache |
| `PORT` | `3000` | Server port |

---

### CLI

```bash
# Full sync (inside container)
node dist/cli sync

# From outside
docker compose -f docker-compose.prod.yml exec app node dist/cli sync
```

---

### Development

```bash
docker compose up -d    # Starts MongoDB + app with hot-reload
```

---

### License

ISC

---

<p align="center">
  <sub>© 2026 Atomic Bot · Built with ❤️ · <a href="https://atomicbot.ai">atomicbot.ai</a></sub>
</p>
