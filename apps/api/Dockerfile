FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies for Playwright and Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    # Playwright Chromium dependencies
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libglib2.0-0 \
    fonts-liberation \
    libfontconfig1 \
    wget \
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

# Generate Prisma client (use specific version matching package.json)
RUN npx prisma@5.22.0 generate --schema=packages/database/prisma/schema.prisma

# Install Playwright browsers (Chromium only)
RUN cd apps/api && npx playwright install chromium

# Build
RUN pnpm --filter @trump-alert/api build

WORKDIR /app/apps/api

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "dist/main"]
