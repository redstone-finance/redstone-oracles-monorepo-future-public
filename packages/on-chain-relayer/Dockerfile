ARG VERSION
FROM redstone-monorepo:${VERSION}

WORKDIR /app/packages/on-chain-relayer

RUN yarn
RUN yarn compile
RUN cd ../evm-connector && yarn compile
RUN yarn build

ENV RELAYER_ITERATION_INTERVAL=600000
ENV RPC_URL=https://rpc.ankr.com/eth_goerli
ENV PRIVATE_KEY=
ENV UNIQUE_SIGNERS_COUNT=1
ENV CACHE_SERVICE_URLS='["https://d1zm8lxy9v2ddd.cloudfront.net"]'
ENV GAS_LIMIT=5000000
ENV HEALTHCHECK_PING_URL=
ENV HISTORICAL_PACKAGES_GATEWAYS=
ENV HISTORICAL_PACKAGES_DATA_SERVICE_ID=redstone-primary-prod

CMD [ "yarn", "start" ]
