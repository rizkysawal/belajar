FROM node:22-slim

WORKDIR /app

# Install native build tools for SQLite compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

# Persistent data directory
VOLUME ["/app/data"]

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
