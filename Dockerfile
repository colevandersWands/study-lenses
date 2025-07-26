# Study Lenses Server - Production Dockerfile

# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install git (required for cloning repositories)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create directories for cache and temp files
RUN mkdir -p cache temp

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S studylenses -u 1001

# Change ownership of app directory
RUN chown -R studylenses:nodejs /app

# Switch to non-root user
USER studylenses

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "server.js"]