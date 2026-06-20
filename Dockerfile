# ---- Build stage ----
FROM node:22-slim AS builder

WORKDIR /app

# Skip Puppeteer's Chrome download (not used in production)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma generated client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT automatically (8080)
EXPOSE 8080

CMD ["node", "dist/main"]
