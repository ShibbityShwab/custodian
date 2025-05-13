FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose the health check port
EXPOSE 8080

CMD ["node", "index.js"] 