# Multi-stage production image.

# --- build stage: compile TS -> dist, generate Prisma client ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- runtime stage: production deps only ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Generated Prisma client + compiled app + schema (for migrate deploy).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 4000
# Apply pending migrations on release, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
