# Frontend Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build-time API base (can be overridden via docker-compose build args)
ARG VITE_API_BASE=http://localhost:5000
ARG VITE_API_ORIGIN=http://localhost:5000
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
