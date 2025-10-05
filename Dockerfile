# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
COPY db ./db
COPY openapi.yaml ./openapi.yaml
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app + assets
COPY --from=build /app/dist ./dist
COPY --from=build /app/openapi.yaml ./openapi.yaml

# port + envs
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server.js"]