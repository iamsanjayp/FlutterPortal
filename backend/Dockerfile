# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Install docker CLI for spawning flutter-runner containers
RUN apk add --no-cache docker-cli

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "src/server.js"]
