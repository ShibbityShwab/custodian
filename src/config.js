const required = ['DISCORD_BOT_TOKEN', 'CLIENT_ID', 'PUBLIC_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  PUBLIC_KEY: process.env.PUBLIC_KEY,
});
