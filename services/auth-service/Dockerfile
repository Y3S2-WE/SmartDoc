# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer-cache efficiency
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy only the pruned node_modules and source from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Do NOT copy .env — environment variables are injected at runtime via Docker Compose
# Remove local .env if accidentally included in the build context
RUN rm -f .env

EXPOSE 3001

CMD ["node", "server.js"]
