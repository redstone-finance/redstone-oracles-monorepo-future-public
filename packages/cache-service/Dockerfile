# ---- Install and copy necessary files ----
FROM node:16 AS install
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY .yarnrc .
COPY tsconfig-common.json .

COPY packages/cache-service/package.json ./packages/cache-service/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/streamr-proxy/package.json ./packages/streamr-proxy/
COPY packages/utils/package.json ./packages/utils/
COPY packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts/

RUN yarn install --frozen-lockfile --non-interactive --production=false

COPY packages/cache-service ./packages/cache-service
COPY packages/protocol ./packages/protocol
COPY packages/sdk ./packages/sdk
COPY packages/streamr-proxy ./packages/streamr-proxy
COPY packages/utils ./packages/utils
COPY packages/oracles-smartweave-contracts ./packages/oracles-smartweave-contracts

# ---- Build code ----
FROM install AS build
WORKDIR /app/packages/cache-service
RUN yarn build

# ---- Release ----
FROM node:16 AS release
WORKDIR /app
COPY package.json .
COPY yarn.lock .

COPY --from=build /app/packages/cache-service/dist ./packages/cache-service
COPY --from=build /app/packages/cache-service/package.json ./packages/cache-service

COPY --from=build /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=build /app/packages/protocol/package.json ./packages/protocol

COPY --from=build /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=build /app/packages/sdk/package.json ./packages/sdk

COPY --from=build /app/packages/streamr-proxy/dist ./packages/streamr-proxy/dist
COPY --from=build /app/packages/streamr-proxy/package.json ./packages/streamr-proxy

COPY --from=build /app/packages/utils/dist ./packages/utils/dist
COPY --from=build /app/packages/utils/package.json ./packages/utils

COPY --from=build /app/packages/oracles-smartweave-contracts/dist ./packages/oracles-smartweave-contracts/dist
COPY --from=build /app/packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts

RUN yarn install --frozen-lockfile --non-interactive --production=true && yarn cache clean

ENV ENABLE_JSON_LOGS=true
ENV MONGO_DB_URL=
ENV ENABLE_STREAMR_LISTENING=true
ENV ENABLE_DIRECT_POSTING_ROUTES=false
ENV MOCK_DATA_SERVICE_ID_FOR_PACKAGES=false

CMD cd packages/cache-service && node src/main.js
