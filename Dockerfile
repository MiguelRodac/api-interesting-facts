# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY prisma ./prisma
COPY tsconfig.json .
COPY src ./src

# Generate Prisma client and build TypeScript
RUN pnpm prisma generate
RUN pnpm run tsc

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only what's needed for production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma/schema.prisma ./prisma/schema.prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "build/index.js"]
