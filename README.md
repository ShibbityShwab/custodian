# Custodian

Custodian is a Discord bot designed to assist with message management, including cleanup of old messages, reminders, and recurring tasks. It runs on **Railway** with **PostgreSQL**.

![Custodian Logo](logo.png)

[![CI](https://github.com/ShibbityShwab/Custodian/actions/workflows/ci.yml/badge.svg)](https://github.com/ShibbityShwab/Custodian/actions/workflows/ci.yml)

## Features

- **Persistent Data**: PostgreSQL for reminders and recurring cleanup schedules.
- **Cron Processing**: `node-cron` fires every minute to process reminders & recurring cleanups.
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

Every push to `main` triggers an automatic GitHub Actions workflow:

| Workflow | Trigger | What it does |
|---|---|---|
| **CI** | push / PR | `npm ci` → audit → lint → test |
| **Register Commands** | manual | Registers/updates Discord slash commands |

---

## Initial Setup

### Prerequisites

- Node.js 20+
- A **Railway account** (or any platform with PostgreSQL support)
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

### 3. Railway Setup

1. Create a new project in Railway.
2. Attach a **PostgreSQL** database to the project.
3. Add the required environment variables (see step 4).
4. Deploy from your GitHub repository.

Railway automatically provides `DATABASE_URL`. You only need to add the Discord credentials.

---

### 4. Set environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Value |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides this) |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `CLIENT_ID` | Discord Application ID |
| `PUBLIC_KEY` | Discord Public Key |
| `PORT` | HTTP port (default: 3000) |

---

### 5. Apply the database schema

```bash
npm run db:migrate
```

---

### 6. Register Slash Commands

```bash
# Requires DISCORD_BOT_TOKEN and CLIENT_ID in your environment
npm run register-commands
```

---

### 7. Link Discord Interactions Endpoint

1. Go to your Discord Developer Portal → **General Information**.
2. Set **Interactions Endpoint URL** to your Railway app URL:
   ```
   https://your-app.railway.app/interactions
   ```
3. Save. Discord will verify the endpoint.

---

## Local Development

Create a `.env` file for local secrets (see `.env.example`):

```ini
DATABASE_URL=postgresql://user:password@localhost:5432/custodian
DISCORD_BOT_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
PUBLIC_KEY=your_public_key_here
PORT=3000
```

Then run:

```bash
npm run dev        # starts server with hot reload (Node.js --watch)
npm test           # run tests
npm run lint       # lint
npm run db:migrate # apply database migrations
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

ISC License 2024 ShibbityShwab
