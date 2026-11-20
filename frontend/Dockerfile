# syntax=docker/dockerfile:1

ARG NODE_VERSION=26.13.1

FROM node:${NODE_VERSION}-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./
RUN npm ci \
    && lock_hash="$(sha256sum package-lock.json)" \
    && printf '%s\n' "${lock_hash%% *}" > node_modules/.jusdigital-package-lock.sha256 \
    && chown -R node:node /app

COPY --chown=node:node . .
COPY --chmod=755 docker/development-entrypoint.sh /usr/local/bin/jusdigital-frontend-entrypoint

USER node

EXPOSE 5173

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:5173').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

ENTRYPOINT ["jusdigital-frontend-entrypoint"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
