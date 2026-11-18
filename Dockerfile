# syntax=docker/dockerfile:1

ARG NODE_VERSION=26.13.1

FROM node:${NODE_VERSION}-bookworm-slim AS base

WORKDIR /app

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

FROM base AS development

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci && chown -R node:node /app

COPY --chown=node:node . .

USER node

CMD ["npm", "run", "start:dev"]

FROM development AS build

RUN npm run build

FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runtime

ENV NODE_ENV=production \
    PORT=3000

COPY --chown=node:node package.json ./
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/v1/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["node", "dist/main.js"]
