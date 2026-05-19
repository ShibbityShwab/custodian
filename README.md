# Custodian

A lightweight Discord bot that cleans up channel messages — no database required.

## Features

- **`/clean`** — Delete messages in the current channel
  - `older_than` (optional): Only delete messages older than a period (e.g. `30s`, `15m`, `1h`, `1d`)
  - `recurring` (optional): Repeat cleanup on an interval in minutes
- Requires the **Manage Messages** permission

## Setup

### Prerequisites

- Node.js 22+
- A Discord Application with a bot token (Discord Developer Portal)

### 1. Clone & install

```bash
git clone https://github.com/ShibbityShwab/Custodian.git
cd Custodian
npm install
```

### 2. Discord Application Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create or select an Application.
3. Note your **Application ID**, **Public Key**, and **Bot Token**.

### 3. Set environment variables

```bash
cp .env.example .env
```

| Variable | Value |
|---|---|
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `CLIENT_ID` | Discord Application ID |
| `PUBLIC_KEY` | Discord Public Key |
| `PORT` | HTTP port (default: 3000) |

### 4. Link Discord Interactions Endpoint

1. Go to your Discord Developer Portal → **General Information**.
2. Set **Interactions Endpoint URL** to your app URL:
   ```
   https://your-app.example.com/interactions
   ```
3. Save. Discord will verify the endpoint.

### 5. Run

```bash
npm run dev        # starts server with hot reload
npm start          # production start
```

Slash commands are registered automatically on startup.

## Deployment

The bot runs anywhere that supports Node.js. A `Dockerfile` is included for containerized deployment.

### Railway

1. Create a new project in Railway.
2. Deploy from your GitHub repository.
3. Set the environment variables listed above.
4. Set the interactions endpoint URL in Discord Developer Portal.

## Local Development

```bash
npm run dev        # starts server with hot reload
npm test           # run tests
npm run lint       # lint
npm run format     # format code
```

## License

ISC License 2024 ShibbityShwab
