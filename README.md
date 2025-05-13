# Custodian

Custodian is a Discord bot designed to assist with message management, including cleanup of old messages, reminders, and recurring tasks. It provides both in-memory and database storage options for flexibility and reliability.

![Custodian Logo](logo.png)

## Features

- **Message Cleanup**:
  - Immediate cleanup of messages older than a specified period
  - Recurring cleanup tasks at specified intervals
  - View and manage cleanup schedules

- **Reminders**:
  - Set one-time reminders in any channel
  - List active reminders
  - Delete reminders
  - Optional database persistence

- **Database Features** (Optional):
  - SQLite database support
  - Automatic backups
  - Manual backup/restore
  - Backup management

- **Flexible Storage**:
  - In-memory storage (default)
  - SQLite database (optional)
  - Automatic fallback to in-memory if database fails

## Setup

To use Custodian in your Discord server, follow these steps:

### Prerequisites

- Node.js (version 18 or higher)
- Docker (optional)

### Local Development

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
# Required
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
DISCORD_BOT_TOKEN=your_discord_bot_token
HEALTH_CHECK_PORT=8080

# Optional Database Configuration
USE_DATABASE=true
DB_PATH=reminders.db
DB_BACKUP_PATH=backups
```

5. Deploy Discord slash commands.

```bash
node deploy-commands.js
```

6. Run the bot.

```bash
node index.js
```

### Docker

You can use Docker to containerize the bot. Make sure you have Docker installed and running.

1. Build the Docker image.

```bash
docker build -t custodian-bot .
```

2. Run the Docker container.

```bash
docker run -d \
  --name custodian-bot \
  -v $(pwd)/data:/app/data \
  -e DISCORD_BOT_TOKEN=your_token \
  -e CLIENT_ID=your_client_id \
  -e GUILD_ID=your_guild_id \
  -e USE_DATABASE=true \
  -e DB_PATH=/app/data/reminders.db \
  -e DB_BACKUP_PATH=/app/data/backups \
  custodian-bot
```

## Usage

Once the bot is running and commands are deployed, you can use the following commands in your Discord server:

### Cleanup Commands
- `/cleanup` - Clean up messages older than specified period
- `/setrecurringcleanup` - Set up recurring cleanup
- `/viewcleanupschedule` - View all active recurring cleanup schedules
- `/cancelrecurringcleanup` - Cancel a recurring cleanup task
- `/editrecurringcleanup` - Edit a recurring cleanup task

### Reminder Commands
- `/setreminder` - Set a reminder in a channel
- `/listreminders` - List all active reminders
- `/deletereminder` - Delete a reminder

### Database Commands (if enabled)
- `/backup` - Create a database backup
- `/restore` - Restore from a backup
- `/listbackups` - List available backups

### General Commands
- `/help` - Show available commands

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

---

© 2024 Custodian. Maintained by ShibbityShwab.