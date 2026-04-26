# Custodian

Custodian is a Discord bot designed to assist with message management, including cleanup of old messages, reminders, and recurring tasks. It runs **100% for free** on Cloudflare Workers + Cloudflare D1 — no servers, no containers, no cost.

![Custodian Logo](logo.png)

[![CI](https://github.com/ShibbityShwab/Custodian/actions/workflows/ci.yml/badge.svg)](https://github.com/ShibbityShwab/Custodian/actions/workflows/ci.yml)
[![Deploy](https://github.com/ShibbityShwab/Custodian/actions/workflows/deploy.yml/badge.svg)](https://github.com/ShibbityShwab/Custodian/actions/workflows/deploy.yml)

## Features

- **Serverless Architecture**: Cloudflare Workers free tier — 100 k requests / day, 24/7 uptime.
- **Persistent Data**: Cloudflare D1 (SQLite) — free tier: 5 GB storage, 5 M reads, 100 k writes / day.
- **Cron Processing**: Cloudflare Cron Triggers fire every minute to process reminders & recurring cleanups (1,440/day — well within the free 100 k/day limit).
- **Message Cleanup**:
  - Immediate cleanup of messages older than a specified period (e.g. `1h`, `1d`)
  - Recurring cleanup tasks at user-defined intervals
  - View and manage cleanup schedules
- **Reminders**:
  - Set one-time reminders in any channel
  - List active reminders
  - Delete reminders

---

## CI/CD

Every push to `main` triggers **two** automatic GitHub Actions workflows:

| Workflow | Trigger | What it does |
|---|---|---|
| **CI** | push / PR | `npm ci` → lint → test |
| **Deploy** | push to `main` | lint → test → D1 schema migration → `wrangler deploy` |
| **Register Commands** | manual | Registers/updates Discord slash commands |

---

## Initial Setup

### Prerequisites

- Node.js 20+
- A **Cloudflare account** (Free tier)
- A **Discord Application/Bot** (Discord Developer Portal)
- A GitHub repository with Actions enabled

---

### 1. Clone & install

```bash
git clone https://github.com/ShibbityShwab/Custodian.git
cd Custodian
npm install
```

---

### 2. Discord Application Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create (or select) an Application.
3. Note your **Application ID** (`CLIENT_ID`), **Public Key** (`PUBLIC_KEY`), and **Bot Token** (`DISCORD_BOT_TOKEN`).

---

### 3. Cloudflare Setup

Log in via Wrangler:

```bash
npx wrangler login
```

Create the D1 database:

```bash
npx wrangler d1 create custodian_db
```

Copy the `database_id` UUID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "custodian_db"
database_id = "YOUR-UUID-HERE"   # ← replace this
```

Generate a Cloudflare API Token at https://dash.cloudflare.com/profile/api-tokens using the **"Edit Cloudflare Workers"** template and add the **D1: Edit** permission.

---

### 4. Set GitHub repository secrets

In your repository → **Settings** → **Secrets and variables** → **Actions**, add:

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (from step 3) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (visible on any dashboard page) |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `CLIENT_ID` | Discord Application ID |

---

### 5. Set Cloudflare runtime secrets

These are read by the Worker at runtime. Run once from your local machine:

```bash
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put CLIENT_ID
npx wrangler secret put PUBLIC_KEY
```

---

### 6. Apply the D1 schema

```bash
# Local (for development)
npm run db:migrate:local

# Production (once only — CI/CD handles this on every push after)
npm run db:migrate:remote
```

---

### 7. Deploy

Simply push to `main` — the **Deploy** workflow runs automatically.

To deploy manually:

```bash
npm run deploy
```

---

### 8. Link Discord Interactions Endpoint

1. Go to your Discord Developer Portal → **General Information**.
2. Set **Interactions Endpoint URL** to your Worker URL:
   ```
   https://custodian-bot.<your-subdomain>.workers.dev/interactions
   ```
3. Save. Discord will verify the endpoint.

---

### 9. Register Slash Commands

Go to **Actions** → **Register Discord Slash Commands** → **Run workflow**.

Or run locally:

```bash
# Requires a .env file with DISCORD_BOT_TOKEN and CLIENT_ID
npm run register-commands
```

---

## Local Development

Create a `.dev.vars` file (gitignored) for local secrets:

```ini
DISCORD_BOT_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
PUBLIC_KEY=your_public_key_here
```

Then run:

```bash
npm run dev        # starts wrangler dev with hot reload
npm test           # run tests
npm run lint       # lint
```

---

## Commands

### Cleanup Commands *(Requires Manage Messages)*
| Command | Description |
|---|---|
| `/cleanup` | Immediately delete messages older than the specified period |
| `/setrecurringcleanup` | Schedule recurring automatic cleanup |
| `/viewcleanupschedule` | View active cleanup schedules |
| `/cancelrecurringcleanup` | Cancel a recurring cleanup |
| `/editrecurringcleanup` | Edit a recurring cleanup interval |

### Reminder Commands
| Command | Description |
|---|---|
| `/setreminder` | Set a one-time reminder |
| `/listreminders` | List active reminders |
| `/deletereminder` | Delete a reminder by ID |

### General
| Command | Description |
|---|---|
| `/help` | Show all commands |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request — CI runs automatically

---

## License

ISC License © 2024 ShibbityShwab
