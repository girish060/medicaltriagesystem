# Development Dockerfile for Web (Vite + pnpm workspace)
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

WORKDIR /workspace
COPY . .

# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile

# Expose Vite dev port
EXPOSE 5173

# Default command: start web in dev mode
CMD ["pnpm", "--filter", "web", "dev", "--", "--host", "0.0.0.0"]
