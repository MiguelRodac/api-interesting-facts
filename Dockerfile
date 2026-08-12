# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (ignore scripts to avoid pnpm build restrictions)
RUN pnpm install --ignore-scripts

# Copy source code
COPY prisma ./prisma
COPY tsconfig.json .
COPY src ./src

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN pnpm run tsc

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only what's needed for production
COPY package.json pnpm-lock.yaml ./
# Install without running any build scripts (Prisma already generated in builder)
RUN pnpm install --prod --ignore-scripts

  # Copy built artifacts from builder
  COPY --from=builder /app/build ./build
  # tsconfig.json with baseUrl rewritten to ./build (so tsconfig-paths resolves to .js files)
  COPY --from=builder /app/tsconfig.json ./tsconfig.json
  RUN sed -i 's|"baseUrl": "./src"|"baseUrl": "./build"|' /app/tsconfig.json
  # Prisma generated client (pnpm stores it inside .pnpm virtual store)
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
