
# syntax=docker/dockerfile:1.4

# Build stage
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN bun run build

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

CMD ["bun", "run", "start"]
