# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.11.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install ALL dependencies (including devDependencies for build tools)
COPY package-lock.json package.json ./
RUN npm install --include=dev

# Copy application code
COPY . .

# Build the application
RUN npm run build


# Final stage for app image
FROM base

# Install Git and CA certificates for repository cloning
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files for production dependencies
COPY package-lock.json package.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/lib ./lib
COPY --from=build /app/views ./views
COPY --from=build /app/create-vir-dir.mjs ./create-vir-dir.mjs

# Start the server by default, this can be overwritten at runtime
EXPOSE 4567
CMD ["npm", "run", "server"]
