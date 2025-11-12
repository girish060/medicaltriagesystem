#!/bin/bash
# Build script for API deployment

# Install dependencies
pnpm install --frozen-lockfile

# Build the API
pnpm --filter api build

# Generate Prisma client
cd apps/api && npx prisma generate
