FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies for Playwright and Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build
RUN pnpm --filter @trump-alert/api build

WORKDIR /app/apps/api

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "dist/main"]
