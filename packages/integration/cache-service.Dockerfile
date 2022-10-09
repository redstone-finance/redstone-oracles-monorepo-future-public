FROM node:16

# Create app directory
RUN mkdir /app
WORKDIR /app

# Bundle monorepo source
COPY . .

RUN yarn

# Build cache-service package
WORKDIR /app/packages/cache-service
RUN yarn
RUN yarn build

CMD yarn start:prod
