# Use Node.js official image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY public/ ./public/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webchess -u 1001

# Change ownership of the app directory
RUN chown -R webchess:nodejs /app
USER webchess

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "src/server/index.js"]

# Multi-stage build for development
FROM base AS development

USER root
RUN npm ci
USER webchess

CMD ["npm", "run", "dev"]

# Production image
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Start command
CMD ["node", "src/server/index.js"]