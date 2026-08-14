# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally (layer cached unless base image changes)
RUN npm install -g pnpm

# Copy only dependency files first — this layer is cached until package files change
COPY package.json pnpm-lock.yaml ./

# Install dependencies (cached until package.json or lock changes)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code — this layer changes often, invalidating only what follows
COPY prisma ./prisma
COPY tsconfig.json .
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript (cached until source changes)
RUN pnpm run tsc

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy dependency files first
COPY package.json pnpm-lock.yaml ./

# Install production dependencies (cached until deps change)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built artifacts from builder (invalidated only if builder image changes)
COPY --from=builder /app/build ./build
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN sed -i 's|"baseUrl": "./src"|"baseUrl": "./build"|' /app/tsconfig.json

# Prisma generated client (pnpm virtual store)
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY docs ./docs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# tsconfig-paths resolves @user, @shared, etc. to ./build/ via baseUrl: ./build
CMD ["node", "-r", "tsconfig-paths/register", "build/index.js"]
