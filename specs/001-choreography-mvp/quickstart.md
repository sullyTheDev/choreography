# Quickstart: Choreography MVP

**Feature**: Choreography MVP
**Date**: 2026-04-08

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

## 1. Clone and Start

```bash
git clone <repository-url> choreography
cd choreography
cp .env.example .env
docker compose up -d
```

The application starts at **http://localhost:3000**.

## 2. First-Time Setup

1. Open http://localhost:3000 in your browser.
2. Click **Sign Up** and create a parent account:
   - Email, password, your name, and a family name (e.g., "The Smiths").
3. You'll be redirected to the **Kids** page. Add your children:
   - Display name, avatar emoji, and a 4–6 digit PIN for each kid.
4. Navigate to **Chores** and create some chores:
   - Give each chore a name, description, emoji, frequency (Daily / Weekly), coin value, and optionally assign it to a specific kid.
5. Navigate to **Prizes** and create rewards:
   - Name, description, and coin cost for each prize.

## 3. Kid Login

Kids log in from the login page by selecting "I'm a Kid", entering the family code (shown in parent settings), and their PIN.

Once logged in, kids see:
- A personalized greeting ("Hey 👧 Emma!")
- Their remaining chores for today
- Their coin balance in the header

Kids tap the checkmark on a chore card to complete it and earn coins.

## 4. Tab Navigation

| Tab | Who sees it | What it does |
|-----|-------------|--------------|
| **Chores** | Kids + Parents | View and complete today's chores |
| **Prize Shop** | Kids + Parents | Browse prizes, redeem coins |
| **Leaderboard** | Kids + Parents | Family rankings by coins earned this week |

## 5. Development Setup (without Docker)

```bash
# Install dependencies
npm install

# Generate database migrations
npx drizzle-kit generate

# Apply migrations (creates SQLite DB file)
npx drizzle-kit migrate

# Start dev server
npm run dev
```

The dev server starts at **http://localhost:5173** with hot reload.

## 6. Running Tests

```bash
# Unit + integration tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e

# Accessibility checks (runs with E2E)
npm run test:e2e -- --grep "a11y"
```

## 7. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/choreography.db` | SQLite database file path |
| `SESSION_SECRET` | (required) | Secret for signing session cookies |
| `PORT` | `3000` | HTTP port |
| `LOG_LEVEL` | `info` | Pino log level (`debug`, `info`, `warn`, `error`) |

## 8. Data Management

- **Export**: Parent Settings → Export Data (downloads JSON)
- **Delete**: Parent Settings → Delete Family (irreversible, requires confirmation)
- **Backup**: The SQLite database is a single file at the path specified by `DATABASE_URL`. Back it up by copying that file.

## 9. Docker Compose Reference

```yaml
services:
  choreography:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - choreography-data:/app/data
    environment:
      - DATABASE_URL=file:./data/choreography.db
      - SESSION_SECRET=change-me-to-a-random-string
      - LOG_LEVEL=info

volumes:
  choreography-data:
```

Stop: `docker compose down`
Stop and remove data: `docker compose down -v`
View logs: `docker compose logs -f choreography`
