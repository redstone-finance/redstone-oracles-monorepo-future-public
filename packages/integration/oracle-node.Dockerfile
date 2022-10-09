FROM node:16

# Create app directory
RUN mkdir /app
WORKDIR /app

# Bundle monorepo source
COPY . .

RUN yarn

# Build oracle-node package
WORKDIR /app/packages/oracle-node
RUN yarn
RUN yarn build

CMD yarn start:prod
