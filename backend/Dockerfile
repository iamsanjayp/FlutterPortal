# Backend Dockerfile
FROM docker:28-cli AS dockercli
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Add docker CLI for spawning flutter-runner containers
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "src/server.js"]
