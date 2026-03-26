# ClawHub Layer API

REST API cache layer for [ClawHub](https://clawhub.ai) skills data. Built with NestJS + MongoDB.

Periodically syncs all skills from ClawHub's Convex backend and serves them via a fast REST API with stale-while-revalidate pattern for individual skill requests.

## Quick Start

### With Docker Compose

```bash
cp .env.example .env
docker compose up -d
```

The API will be available at `http://localhost:3000`.

### Local Development

Requirements: Node.js 22+, MongoDB 7+

```bash
cp .env.example .env
npm install
npm run start:dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/clawhub-layer` | MongoDB connection string |
| `CONVEX_CLOUD_URL` | `https://wry-manatee-359.convex.cloud` | ClawHub Convex query API |
| `CONVEX_SITE_URL` | `https://wry-manatee-359.convex.site` | ClawHub HTTP API |
| `SYNC_CRON` | `0 3 * * *` | Cron expression for daily sync (default: 3am) |
| `PORT` | `3000` | Server port |

## API Endpoints

### List Skills

```
GET /api/skills?page=1&limit=25&sort=downloads&dir=desc&nonSuspiciousOnly=true
```

**Query Parameters:**
- `page` — page number (default: 1)
- `limit` — items per page, max 200 (default: 25)
- `sort` — `downloads`, `stars`, `installs`, `updated`, `newest`, `name` (default: `downloads`)
- `dir` — `asc` or `desc` (default: `desc`)
- `nonSuspiciousOnly` — filter out suspicious skills (default: false)

### Search Skills

```
GET /api/skills/search?q=summarize&limit=25
```

Uses MongoDB text search, falls back to ClawHub search API.

### Get Skill by Slug

```
GET /api/skills/:slug
```

Returns cached data immediately and triggers background refresh from ClawHub.
Includes full detail: security scan results, file list, moderation info, fork data.

### Get File Content

```
GET /api/skills/:slug/files?path=SKILL.md
```

Returns file content for the skill. Cached with stale-while-revalidate.

### Health Check

```
GET /health
```

## Data Sync Strategy

1. **Daily bulk sync** — Fetches all ~36k skills from ClawHub via `listPublicPageV4` Convex query (200 per page, ~2-3 min total)
2. **On-demand enrichment** — When a specific skill is requested, returns cached data and fetches full detail (security scans, files, moderation) from `getBySlug` Convex query in background
3. **File caching** — SKILL.md and other file contents cached in MongoDB, refreshed in background on access
