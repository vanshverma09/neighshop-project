# Multi-stage production Dockerfile for NeighShop Global Shared API
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
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

# Copy production dependencies and built code
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Create uploads directory for persistent storage
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
