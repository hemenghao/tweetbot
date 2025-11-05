# Twitter User Monitoring & Crypto Analysis Platform

This project implements a full-stack system for monitoring selected Twitter accounts, analysing their tweets for actionable crypto market insights, and managing alerting workflows to support investment decisions.

## Key Features

- **MongoDB data models** for monitored users, tweet analysis artefacts, and global monitoring configuration.
- **Follower discovery workflow** for scanning the follow list of a seed account (default: `@InfoEchoes`) and onboarding users for monitoring.
- **CSV / JSON import pipeline** to bulk register Twitter handles with deduplication and provenance tracking.
- **React + Ant Design operations dashboard** with search, filtering, sorting, batch activation, quality ratings, and metadata editing for monitored accounts.
- **Tweet ingestion & AI-lite analysis loop** that retrieves the latest tweets, derives sentiment, topics, keywords, and crypto asset mentions, updates user quality scores, and persists structured analytics.
- **Dynamic quality rating model** that blends accuracy, influence, and timeliness to produce 0–100 scores for each monitored user.
- **Notification hooks** capable of driving webhook/email/queue integrations whenever high quality or watchlisted insights are detected.
- **Scheduled scanner job** that continuously analyses active users based on configurable scan intervals and concurrency limits.
- **Extensive logging & error handling** to aid observability during operations.

## Architecture Overview

| Layer            | Technology                       | Description                                                |
| ---------------- | --------------------------------- | ---------------------------------------------------------- |
| Backend API      | Node.js, Express, TypeScript      | REST API, tweet ingestion, analysis, notifications         |
| Database         | MongoDB with Mongoose             | Schemas mirror the ticket specification                    |
| Frontend UI      | React (Vite) + Ant Design         | Monitoring dashboard for operators                         |
| Task Scheduling  | Node.js timers                    | Periodic tweet scan job for active users                   |
| External Services| TwitterAPI.io (mockable), Webhooks| Twitter data retrieval, downstream notifications           |

A bootstrap routine ensures the seed account `@InfoEchoes` is monitored and its followings are imported on startup. All external integrations can be toggled to “mock” mode for local development via environment variables.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 6.x running locally or reachable via connection string

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file inside `server/` (see `.env.example` snippet below) or export the variables before running the backend.

```ini
# MongoDB connection string
MONGODB_URI=mongodb://127.0.0.1:27017/twitter_monitor

# Twitter API key (provided in the ticket)
TWITTER_API_KEY=new1_a673049ed1974ff9b44e931b549ec515

# Optional: force mock data instead of live API calls
TWITTER_USE_MOCK=true

# Redis connection string (required for stream processing helpers)
REDIS_URL=redis://127.0.0.1:6379
# REDIS_TLS=true

# Optional notification integrations
# NOTIFICATION_WEBHOOK_URL=https://example.com/webhook
```

> **Tip:** Leave `TWITTER_USE_MOCK=true` for local development. The system ships with curated mock data that satisfies the acceptance criteria without external dependencies.

### Running the Backend

```bash
npm run dev:server
```

This will:

1. Connect to MongoDB
2. Ensure the default monitoring configuration exists
3. Bootstrap the seed account (`@InfoEchoes`) and import its followings
4. Start the REST API on `http://localhost:4000`
5. Launch the tweet scanning scheduler (interval derived from config)

### Local Redis (optional)

A lightweight Redis container is available for local development via Docker Compose:

```bash
docker compose -f docker-compose.redis.yml up
```

By default the instance listens on `localhost:6379` without persistence, matching the `REDIS_URL` value in `.env.example`. Set `REDIS_TLS=true` when connecting to a TLS-enabled deployment.

### Running the Frontend

```bash
npm run dev:client
```

Open `http://localhost:5173` to access the monitoring dashboard. Vite proxies `/api` requests to the backend (`http://localhost:4000`).

## Core Workflows

### 1. Scan Followings

Endpoint: `POST /api/twitter/scan-followings`

Payload:

```json
{ "handle": "InfoEchoes" }
```

Newly discovered accounts are inserted into the `monitored_users` collection with `monitoring.is_active = false` and `monitoring.added_by = "following_scan"`.

### 2. Import Users from File

Endpoint: `POST /api/import`

Supports multipart uploads with CSV or JSON content:

```csv
twitter_handle,display_name
alpha_trader,Alpha Trader
```

```json
[{ "twitter_handle": "defi_builder", "display_name": "DeFi Builder" }]
```

Imported users are deduplicated by handle and tagged with `monitoring.added_by = "file_import"`.

### 3. Manage Users in UI

The React dashboard provides:

- Search across handles, display names, and tags
- Status segmented control (All / Active / Inactive)
- Sorting by quality score, followers, or last scan
- Row selection with batch activate/deactivate controls
- Inline toggle for monitoring status
- Drawer for editing tags, notes, and reviewing recent mentions/topics
- Manual tweet scan trigger per user

### 4. Tweet Scanning & Analysis

- Scheduler frequency is defined in `monitoring_config.scan_settings.scan_interval` (minutes).
- Each cycle fetches the last 5 tweets per active user (`scan_settings.tweet_limit`).
- `analysisEngine` performs:
  - Crypto asset detection (symbols & aliases)
  - Sentiment scoring (bullish/bearish/neutral)
  - Topic classification (crypto, DeFi, NFT, trading)
  - Keyword extraction & quality indicator heuristics
- `qualityRatingService` produces accuracy, influence, timeliness metrics and blends them into a score (0–100) stored on the user record.
- `tweet_analysis` documents persist the structured output alongside engagement metrics.

### 5. Notifications

`notificationService` checks:

- Quality score against `notification_rules.min_quality_score`
- Asset mentions intersecting `notification_rules.asset_watchlist`
- Presence of `notification_rules.important_keywords`

When triggered, webhook payloads (and log entries) include the assets, sentiment, and a justification message. Further integrations (email, queues) can be added within the same service.

## Data Models (MongoDB)

Schemas mirror the ticket specification:

- `monitored_users`
- `tweet_analysis`
- `monitoring_config`

See server models for exact field definitions.

## API Reference (selected)

| Method | Path                              | Purpose                              |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/api/health`                     | Health check                         |
| GET    | `/api/users`                      | List monitored users                 |
| PATCH  | `/api/users/:id`                  | Update tags / notes / topics         |
| PATCH  | `/api/users/:id/monitoring`       | Toggle monitoring / change frequency |
| POST   | `/api/users/batch-monitoring`     | Batch activation toggles             |
| POST   | `/api/twitter/scan-followings`    | Import followings for a handle       |
| POST   | `/api/import`                     | CSV/JSON user import                 |
| POST   | `/api/analysis/scan`              | Trigger tweet scan (all or specific) |
| GET    | `/api/monitoring-config`          | Retrieve current config              |
| PUT    | `/api/monitoring-config`          | Update scan or notification rules    |

## Acceptance Checklist

- ✅ MongoDB models for monitored users, tweet analysis, and monitoring config
- ✅ Following scan of `@InfoEchoes` with onboarding flow
- ✅ CSV/JSON import with deduplication
- ✅ React UI for monitoring management with batch operations
- ✅ Tweet scanning & analysis pipeline for recent tweets
- ✅ Crypto asset detection & sentiment heuristics
- ✅ Quality rating computation and persistence
- ✅ Notification hook for actionable insights
- ✅ Error handling & structured logging
- ✅ Documentation covering setup & usage (this README)

## Development Notes

- The backend defaults to **mock data** for Twitter followings/tweets when `TWITTER_USE_MOCK=true` or the API key is missing. Disable this flag to call the real API (requires network access).
- Scheduler concurrency is capped by `scan_settings.max_concurrent_scans` to avoid API overload.
- `analysisEngine` is modular—swap in OpenAI or a custom NLP model by replacing the implementation while preserving the return contract.
- For production use, add authentication, rate limiting, persistent notification integrations, and robust Twitter API error handling/backoff.

## Testing the End-to-End Flow

1. Start MongoDB and both server/client dev servers.
2. Load the dashboard at `http://localhost:5173` – seeded data for `@InfoEchoes` should appear.
3. Activate selected followings via the batch controls.
4. Trigger a manual scan using the **Scan** button beside a user or **Scan Active Users** for all.
5. Observe analysis results (topics, mentions, quality score) update in the table and drawer.
6. Check server logs for notification entries when actionable tweets are detected.

Enjoy exploring the crypto intelligence surface generated from curated Twitter accounts! 🚀
