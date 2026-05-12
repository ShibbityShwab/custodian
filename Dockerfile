# Build stage
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Production stage
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Only copy necessary files for runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/deploy-commands.js ./
COPY --from=builder /app/src/constants.js ./src/constants.js

# Clean up devDependencies from node_modules if needed, 
# but builder npm ci + copy is safer for some native builds.
# For simplicity and speed in this specific case, we'll stick to a lean copy.
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "src/server.js"]
