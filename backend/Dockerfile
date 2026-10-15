# Multi-stage production Dockerfile for NeighShop Global Shared API
FROM node:20 AS builder

WORKDIR /app

# Ensure native compilation toolchain is present for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy installed dependencies and compiled dist directly from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create uploads directory for persistent storage
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
