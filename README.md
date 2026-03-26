# ClawHub Layer API

[![API Docs](https://img.shields.io/badge/OpenAPI-Swagger_UI-85ea2d?logo=swagger&logoColor=white)](https://clawhub.atomicbot.ai/docs)
[![OpenAPI JSON](https://img.shields.io/badge/OpenAPI-JSON-6ba539?logo=openapiinitiative&logoColor=white)](https://clawhub.atomicbot.ai/docs-json)
[![OpenAPI YAML](https://img.shields.io/badge/OpenAPI-YAML-6ba539?logo=openapiinitiative&logoColor=white)](https://clawhub.atomicbot.ai/docs-yaml)
[![Live API](https://img.shields.io/badge/Live-clawhub.atomicbot.ai-blue)](https://clawhub.atomicbot.ai)
[![ClawHub](https://img.shields.io/badge/Source-clawhub.com-black)](https://clawhub.com)

> **The missing REST API for [ClawHub](https://clawhub.com) skills data.**

ClawHub is the largest skills marketplace for AI agents — thousands of installable skill bundles for Cursor, Claude, GPT and other AI-powered tools. But its public API is limited: no full-text search, no security scan results, no file contents, no moderation data.

**ClawHub Layer API** fills the gap. It continuously pulls the complete skills catalog directly from ClawHub's Convex cloud database, caches everything in MongoDB, and exposes a clean, fast REST API with full data — including fields the official API simply doesn't serve.

---

## What You Get

- **Complete catalog** — all 36,000+ skills with stats, versions, tags, and ownership
- **Full-text search** — weighted search across slug, name, and description
- **Security data** — VirusTotal scan results and LLM-based analysis (verdict, confidence, dimensions)
- **Moderation info** — suspicious/malicious flags, removal status, reason codes
- **File contents** — read any file from any skill (SKILL.md, configs, source code)
- **Comments** — live comment threads with user profiles, straight from ClawHub
- **Fork tracking** — fork/duplicate relationships between skills
- **Auto-sync** — configurable cron keeps your data fresh
- **On-demand enrichment** — detail data fetched and cached on first request
- **Swagger UI** — interactive API docs at `/docs`

---

## Quick Start

```bash
git clone https://github.com/atomicbot/clawhub-layer-api.git
cd clawhub-layer-api
docker compose -f docker-compose.prod.yml up -d
```

API is live at `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

Or try the public instance: **[clawhub.atomicbot.ai/docs](https://clawhub.atomicbot.ai/docs)**

Trigger initial sync:

```bash
docker compose -f docker-compose.prod.yml exec app node dist/cli sync
```

---

## API

### List Skills

```
GET /api/skills?page=1&limit=25&sort=downloads&dir=desc&nonSuspiciousOnly=true
```

| Param | Values | Default |
|-------|--------|---------|
| `sort` | `downloads` · `stars` · `installs` · `updated` · `newest` · `name` | `downloads` |
| `dir` | `asc` · `desc` | `desc` |
| `limit` | `1–200` | `25` |
| `nonSuspiciousOnly` | `true` · `false` | `false` |

### Search

```
GET /api/skills/search?q=summarize&limit=25
```

Weighted full-text search: slug (×10), name (×5), summary (×1).

### Skill Detail

```
GET /api/skills/:slug
```

Returns the complete skill record: metadata, latest version, owner, file list, security analysis (VT + LLM), moderation status, fork info, and SKILL.md content.

Data is cached in MongoDB. If stale, it's re-fetched from ClawHub on request.

### File Content

```
GET /api/skills/:slug/files?path=SKILL.md
```

Returns raw file content for any file in the skill package.

### Comments

```
GET /api/skills/:slug/comments?limit=50
```

Live comments from ClawHub with user profiles.

### Health

```
GET /health
```

---

## How Sync Works

```
ClawHub Convex DB ──▶ Layer API (MongoDB) ──▶ Your App
       ▲                      │
       └── cron / on-demand ──┘
```

1. **Bulk sync** (cron) — pages through the entire ClawHub catalog via `listPublicPageV4`, upserting into MongoDB. ~36k skills in ~2-3 minutes.
2. **Detail enrichment** (on-demand) — when `GET /api/skills/:slug` is called, full detail is fetched from `getBySlug` and cached with a configurable TTL.
3. **File caching** — file contents are fetched from ClawHub's site API and cached in MongoDB with the same TTL.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/clawhub-layer` | MongoDB connection |
| `CONVEX_CLOUD_URL` | `https://wry-manatee-359.convex.cloud` | ClawHub Convex query endpoint |
| `CONVEX_SITE_URL` | `https://wry-manatee-359.convex.site` | ClawHub site HTTP API |
| `SYNC_CRON` | `0 */3 * * *` | Sync schedule (default: every 3 hours) |
| `CACHE_TTL_HOURS` | `3` | TTL for detail/file cache |
| `PORT` | `3000` | Server port |

---

## CLI

```bash
# Run full sync manually (inside container)
node dist/cli sync

# Or from outside
docker compose -f docker-compose.prod.yml exec app node dist/cli sync
```

---

## Development

```bash
docker compose up -d    # Starts MongoDB + app with hot-reload
```

---

## Tech Stack

**NestJS** · **MongoDB** + **Mongoose** · **Docker** · **Swagger/OpenAPI**

---

## License

ISC
