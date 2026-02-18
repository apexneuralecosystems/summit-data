# India AI Summit - Sessions app (Node + React + MongoDB)
# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY . .
RUN npm run build

# Stage 2: run
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY db ./db
COPY migrate-mongo-config.js ./
COPY migrations ./migrations
COPY scripts ./scripts

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Load session data, optionally fetch YouTube transcripts, then start the server
CMD ["sh", "-c", "node scripts/seed-postgres.js || true; node scripts/fetch-youtube-transcripts.js || true; exec node server/index.js"]
