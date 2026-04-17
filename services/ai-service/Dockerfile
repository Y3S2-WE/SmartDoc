# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN rm -f .env

# Create uploads directory for PDF/DOCX document ingestion
RUN mkdir -p /app/uploads

EXPOSE 3008

CMD ["node", "server.js"]
