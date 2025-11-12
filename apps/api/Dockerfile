# Development Dockerfile for API (NestJS + pnpm workspace)
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /workspace
COPY . .

# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile

# Expose API port
EXPOSE 3000

# Default command: start API in dev mode
CMD ["pnpm", "--filter", "api", "dev"]
