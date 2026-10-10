# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production serve stage with Nginx
FROM nginx:alpine

# Copy built React SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure public/materi is copied
COPY --from=builder /app/public/materi /usr/share/nginx/html/materi

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
