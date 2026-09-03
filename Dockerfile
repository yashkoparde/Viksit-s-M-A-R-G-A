# Multi-stage Dockerfile for MARGA Statutory Platform
# Stage 1: Build Frontend Distribution
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Express Runtime
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend distribution
COPY --from=builder /app/dist ./dist

# Copy backend application, configurations, datasets, and sequence assets
COPY src ./src
COPY data ./data
COPY dataset ./dataset
COPY public ./public
COPY sequence ./sequence
COPY uploads ./uploads

# Expose Statutory Platform Port
EXPOSE 5000

# Start MARGA Platform
CMD ["node", "src/server.js"]
