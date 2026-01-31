FROM node:24-alpine AS pnpm
COPY ./pnpm-workspace.yaml ./pnpm-lock.yaml /app/
COPY ./web/package.json /app/web/
COPY ./server/package.json /app/server/
WORKDIR /app
RUN corepack enable

FROM pnpm AS development-dependencies-env
COPY . /app/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM pnpm AS production-dependencies-env
COPY . /app/
RUN pnpm install --frozen-lockfile -P --ignore-scripts

FROM pnpm AS build-web-env
COPY ./web /app/web/
COPY ./pnpm-workspace.yaml /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
COPY --from=development-dependencies-env /app/web/node_modules /app/web/node_modules
WORKDIR /app/web
RUN pnpm run build

FROM pnpm AS build-server-env
COPY ./server /app/server/
COPY ./pnpm-workspace.yaml /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
COPY --from=development-dependencies-env /app/server/node_modules /app/server/node_modules
WORKDIR /app/server
RUN pnpm run build

FROM node:24-alpine
RUN corepack enable
COPY ./pnpm-workspace.yaml ./pnpm-lock.yaml /app/
COPY ./web/package.json /app/web/
COPY ./server/package.json /app/server/
WORKDIR /app

# Copy production dependencies
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=production-dependencies-env /app/web/node_modules /app/web/node_modules
COPY --from=production-dependencies-env /app/server/node_modules /app/server/node_modules

# Copy built artifacts
COPY --from=build-web-env /app/web/dist /app/web/dist
COPY --from=build-server-env /app/server/dist /app/server/dist

# Copy server source (needed for runtime)
COPY ./server/src /app/server/src

# Expose port (server serves both API and web app)
EXPOSE 3001

# Set environment variable to enable static file serving
ENV SERVE_WEB_APP=true

# Start the server (it will serve both API and web app)
WORKDIR /app/server
CMD ["node", "dist/index.js"]
