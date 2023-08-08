# ---- Install and copy necessary files ----
FROM node:16 AS install
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY .yarnrc .

COPY packages/on-chain-relayer/package.json ./packages/on-chain-relayer/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/utils/package.json ./packages/utils/
COPY packages/evm-connector/package.json ./packages/evm-connector/
COPY packages/rpc-providers/package.json ./packages/rpc-providers/
COPY packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts/

RUN yarn install --frozen-lockfile --non-interactive --production=false

COPY packages/on-chain-relayer ./packages/on-chain-relayer
COPY packages/protocol ./packages/protocol
COPY packages/sdk ./packages/sdk
COPY packages/utils ./packages/utils
COPY packages/evm-connector ./packages/evm-connector
COPY packages/rpc-providers ./packages/rpc-providers
COPY packages/oracles-smartweave-contracts ./packages/oracles-smartweave-contracts

# ---- Build code ----
FROM install AS build
WORKDIR /app/packages/on-chain-relayer
RUN yarn compile
RUN cd ../evm-connector && yarn compile
RUN yarn build

# ---- Release ----
FROM node:16 AS release
WORKDIR /app
COPY package.json .
COPY yarn.lock .

COPY --from=build /app/packages/on-chain-relayer/relayer-manifests ./packages/on-chain-relayer/relayer-manifests
COPY --from=build /app/packages/on-chain-relayer/dist ./packages/on-chain-relayer
COPY --from=build /app/packages/on-chain-relayer/package.json ./packages/on-chain-relayer

COPY --from=build /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=build /app/packages/protocol/package.json ./packages/protocol

COPY --from=build /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=build /app/packages/sdk/package.json ./packages/sdk

COPY --from=build /app/packages/utils/dist ./packages/utils/dist
COPY --from=build /app/packages/utils/package.json ./packages/utils

COPY --from=build /app/packages/evm-connector/dist ./packages/evm-connector/dist
COPY --from=build /app/packages/evm-connector/package.json ./packages/evm-connector

COPY --from=build /app/packages/rpc-providers/dist ./packages/rpc-providers/dist
COPY --from=build /app/packages/rpc-providers/package.json ./packages/rpc-providers

COPY --from=build /app/packages/oracles-smartweave-contracts/dist ./packages/oracles-smartweave-contracts/dist
COPY --from=build /app/packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts

RUN yarn install --frozen-lockfile --non-interactive --production=true

ENV RELAYER_ITERATION_INTERVAL=600000
ENV RPC_URLS='["https://rpc.ankr.com/eth_goerli"]'
ENV PRIVATE_KEY=
ENV UNIQUE_SIGNERS_COUNT=1
ENV CACHE_SERVICE_URLS='["https://d1zm8lxy9v2ddd.cloudfront.net"]'
ENV GAS_LIMIT=5000000
ENV HEALTHCHECK_PING_URL=
ENV HISTORICAL_PACKAGES_GATEWAYS=
ENV HISTORICAL_PACKAGES_DATA_SERVICE_ID=redstone-primary-prod

CMD cd packages/on-chain-relayer && node src/run-relayer.js
