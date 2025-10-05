FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
    python3 python3-dev build-essential sqlite3 libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Use production node environment by default.
ENV NODE_ENV=production

WORKDIR /usr/src/app


# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
# RUN --mount=type=bind,source=package.json,target=package.json \
#     --mount=type=bind,source=package-lock.json,target=package-lock.json \
#     --mount=type=cache,target=/root/.npm \
#     npm ci --omit=dev

COPY package*.json ./
RUN npm ci --omit=dev

RUN chown -R node:node /usr/src/app/

COPY entrypoint.sh ./

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["node", "./dist/index.js"]