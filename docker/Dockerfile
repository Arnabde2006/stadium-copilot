# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy lock files and packages
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY apps/backend/package*.json ./apps/backend/

# Install all dependencies including devDependencies
RUN npm ci

# Copy the rest of the workspace source code
COPY . .

# Build frontend and backend workspaces
RUN npm run build --workspaces

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package descriptors for installing production dependencies
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install production dependencies only
RUN npm ci --only=production

# Copy build artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/dist ./apps/frontend/dist

# Configure runtime environment
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start the Express backend, which serves both API and frontend client
CMD ["node", "apps/backend/dist/server.js"]
