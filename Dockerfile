# Use Node.js as the base image
FROM node:16

# Install PostgreSQL client (optional)
RUN apt-get update && apt-get install -y postgresql-client

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the bot
CMD ["node", "index.js"]
