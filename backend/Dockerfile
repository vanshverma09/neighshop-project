# Multi-stage production Dockerfile for NeighShop Global Shared API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source code and build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Copy production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create uploads and database directory for persistent volumes
RUN mkdir -p /app/uploads /app/database && chown -R node:node /app

USER node

EXPOSE 5000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
