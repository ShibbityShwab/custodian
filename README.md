# Custodian

Custodian is a Discord bot designed to assist with the cleanup of old messages in channels. It provides commands to immediately clean up messages older than a specified period and also allows setting up recurring cleanup tasks in channels at specified intervals.

![Custodian Logo](logo.png)

## Features

- **Immediate Cleanup**: Start cleaning up messages older than a specified period in a channel.
- **Recurring Cleanup**: Set up recurring cleanup tasks in channels at specified intervals.
- **Customizable**: Easily configure cleanup intervals and thresholds.

## Setup

To use Custodian in your Discord server, follow these steps:

### Prerequisites

- Node.js (version 14 or higher)
- Docker (optional)
- PostgreSQL (optional)

### Installation

1. Clone this repository to your local machine.
2. Navigate to the project directory.

```bash
git clone <repository_url>
cd <project_directory>
```

3. Install dependencies using npm.

```bash
npm install
```

4. Set up your environment variables. Create a `.env` file in the root directory and populate it with the required variables. Example:

```dotenv
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
DISCORD_BOT_TOKEN=your_discord_bot_token
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

5. Set up your PostgreSQL database (if using). You can use the provided `recurring_cleanups.sql` script to create the necessary table.

```bash
psql -U your_database_user -d your_database_name -a -f recurring_cleanups.sql
```

6. Deploy Discord slash commands.

```bash
node deploy-commands.js
```

7. Run the bot.

```bash
node bot.js
```

### Docker

Alternatively, you can use Docker to containerize the bot. Make sure you have Docker installed and running.

1. Build the Docker image.

```bash
docker build -t custodian-bot .
```

2. Run the Docker container.

```bash
docker run -d --name custodian-bot custodian-bot
```

## Usage

Once the bot is running and commands are deployed, you can use the following commands in your Discord server:

- **/cleanup**: Immediately starts cleaning up messages older than the specified period in a channel.
- **/setrecurringcleanup**: Sets up a recurring cleanup task in a channel at the specified interval.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

© 2024 Custodian. Maintained by ShibbityShwab.