# Docker container built using this Dockerfile
# can be published to the public docker registry
# But before running the container it must be configured to provide
# the node config through environment variables

ARG VERSION
FROM redstone-monorepo:${VERSION}

WORKDIR /app/packages/cache-service

RUN yarn
RUN yarn build

# Setting production env variables
ENV ENABLE_JSON_LOGS=true
ENV MONGO_DB_URL=
ENV ENABLE_STREAMR_LISTENING=true
ENV ENABLE_DIRECT_POSTING_ROUTES=false
ENV MOCK_DATA_SERVICE_ID_FOR_PACKAGES=false

# Exposing 3000 port
EXPOSE 3000

# Running redstone cache service
CMD yarn start:prod
