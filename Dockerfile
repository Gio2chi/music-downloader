# Stage 1: Build
FROM node:20-bullseye AS build
WORKDIR /usr/src/app

# Install build tools for compiling native modules
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Production
FROM node:20-bullseye-slim
WORKDIR /usr/src/app

# Only copy production node_modules
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist 

RUN chown -R node:node /usr/src/app
USER node

EXPOSE 3000
CMD ["node", "./dist/app/index.js"]