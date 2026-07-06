# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# (Optional) If there is a build step for the backend (e.g. Babel/TypeScript), run it here
# RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Set to production mode
ENV NODE_ENV=production

# Copy only package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the source code and entrypoint
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/src ./src

# Expose the API port
EXPOSE 5000

# Run the app as a non-root user for security
USER node

# Start the server
CMD ["node", "index.js"]
