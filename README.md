# Custodian

Custodian is a Discord bot designed to assist with the cleanup of old messages in channels. It provides commands to immediately clean up messages older than a specified period and also allows setting up recurring cleanup tasks in channels at specified intervals.

![Custodian Logo](logo.png)

## Features

- **Immediate Cleanup**: Start cleaning up messages older than a specified period in a channel.
- **Recurring Cleanup**: Set up recurring cleanup tasks in channels at specified intervals.
- **Customizable**: Easily configure cleanup intervals and thresholds.
- **Simple & In-Memory**: No database required. All state is managed in-memory for simplicity and speed.

## Setup

To use Custodian in your Discord server, follow these steps:

### Prerequisites

- Node.js (version 18 or higher)
- Docker (optional)
- DigitalOcean account (for deployment)

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
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
DISCORD_BOT_TOKEN=your_discord_bot_token
HEALTH_CHECK_PORT=8080
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

Alternatively, you can use Docker to containerize the bot. Make sure you have Docker installed and running.

1. Build the Docker image.

```bash
docker build -t custodian-bot .
```

2. Run the Docker container.

```bash
docker run -d --name custodian-bot custodian-bot
```

### Deployment to DigitalOcean App Platform

1. **Prepare Your Repository**
   - Ensure your code is pushed to a GitHub repository
   - Make sure your repository includes:
     - `Dockerfile`
     - `.dockerignore`
     - All necessary source files
     - `package.json` with correct dependencies

2. **Set Up DigitalOcean App Platform**
   - Log in to your DigitalOcean account
   - Navigate to App Platform
   - Click "Create App"
   - Select your GitHub repository
   - Choose the branch you want to deploy

3. **Configure Your App**
   - Select "Dockerfile" as the deployment method
   - Set the following environment variables:
     ```
     DISCORD_BOT_TOKEN=your_discord_bot_token
     CLIENT_ID=your_discord_client_id
     GUILD_ID=your_discord_guild_id
     HEALTH_CHECK_PORT=8080
     ```
   - Configure the following settings:
     - Instance Count: 1
     - Instance Size: Basic
     - HTTP Port: 8080

4. **Deploy**
   - Review your configuration
   - Click "Launch App"
   - Wait for the deployment to complete

5. **Monitor Your Deployment**
   - Check the logs in the DigitalOcean dashboard
   - Verify the health check endpoint is responding
   - Test your Discord bot commands

## Usage

Once the bot is running and commands are deployed, you can use the following commands in your Discord server:

- `/cleanup` - Clean up messages older than specified period
- `/setrecurringcleanup` - Set up recurring cleanup
- `/viewcleanupschedule` - View all active recurring cleanup schedules
- `/cancelrecurringcleanup` - Cancel a recurring cleanup task
- `/editrecurringcleanup` - Edit a recurring cleanup task
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