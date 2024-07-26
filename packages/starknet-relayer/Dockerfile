FROM public.ecr.aws/docker/library/node:20.16

WORKDIR /app

COPY package.json package.json

RUN yarn

COPY . .

ENV RELAYER_ITERATION_INTERVAL=10000
ENV UPDATE_PRICE_INTERVAL=110000

#ENV PRICE_ADAPTER_ADDRESS=

ENV RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_6
#ENV OWNER_ADDRESS=
#ENV PRIVATE_KEY=

ENV MAX_ETH_FEE=0.007

RUN yarn build

CMD [ "yarn", "start" ]
