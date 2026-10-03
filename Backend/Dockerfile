# ==========================================
# TEZLAA BACKEND - PRODUCTION DOCKERFILE
# ==========================================

# ------------------------------------------
# Stage 1: Build
# ------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client for Debian
RUN npx prisma generate

# Copy application source
COPY . .

# Build TypeScript
RUN npm run build


# ------------------------------------------
# Stage 2: Production
# ------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL required by Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma schema
COPY prisma ./prisma/

# Copy generated Prisma engine/client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Railway supplies the PORT automatically
EXPOSE 5000

# Start application
CMD ["node", "dist/server.js"]