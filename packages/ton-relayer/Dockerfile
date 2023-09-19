# ---- Install and copy necessary files ----
FROM node:16 AS install
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY .yarnrc .

COPY packages/ton-relayer/package.json ./packages/ton-relayer/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/utils/package.json ./packages/utils/
COPY packages/ton-connector/package.json ./packages/ton-connector/
COPY packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts/

RUN yarn install --non-interactive --production=false

COPY packages/ton-relayer ./packages/ton-relayer
COPY packages/protocol ./packages/protocol
COPY packages/sdk ./packages/sdk
COPY packages/utils ./packages/utils
COPY packages/ton-connector ./packages/ton-connector
COPY packages/oracles-smartweave-contracts ./packages/oracles-smartweave-contracts

# ---- Build code ----
FROM install AS build
WORKDIR /app/packages/ton-relayer
RUN yarn build

# ---- Release ----
FROM node:16 AS release
WORKDIR /app
COPY package.json .
COPY yarn.lock .

COPY --from=build /app/packages/ton-relayer/dist ./packages/ton-relayer/dist
COPY --from=build /app/packages/ton-relayer/package.json ./packages/ton-relayer

COPY --from=build /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=build /app/packages/protocol/package.json ./packages/protocol

COPY --from=build /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=build /app/packages/sdk/package.json ./packages/sdk

COPY --from=build /app/packages/utils/dist ./packages/utils/dist
COPY --from=build /app/packages/utils/package.json ./packages/utils

COPY --from=build /app/packages/ton-connector/dist ./packages/ton-connector/dist
COPY --from=build /app/packages/ton-connector/package.json ./packages/ton-connector

COPY --from=build /app/packages/oracles-smartweave-contracts/dist ./packages/oracles-smartweave-contracts/dist
COPY --from=build /app/packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts

ENV RELAYER_ITERATION_INTERVAL=10000
ENV HEALTHCHECK_PING_URL="https://your-uptime-kuma-url.com/api/push/wxyz7890?status=up&msg=OK"
ENV MANIFEST_FILE=testnet-test.json

ENV TONCENTER_API_KEY=
ENV WALLET_MNEMONIC=

RUN yarn install --frozen-lockfile --non-interactive --production=true

CMD cd packages/ton-relayer && yarn start
