# redstone-cache-service

This is a NestJS web app, which serves as a gateway to the data in the RedStone ecosystem.

## Endpoints

- data-packages (main)
  - \[MAYBE\] the first 2 endpoints will be replaced with graphql
  - GET /data-packages/latest (query params: signerAddress, limit, dataServiceId)
  - GET /data-packages (query params: toTimestamp, signerAddress, limit, dataServiceId)
  - POST /data-packages (body = a single package)
  - POST /data-packages/bulk (body = array of data packages)
- other (helpful endpoints)
  - GET /oracle-registry-state
  - GET /symbols-metadata

## Background jobs

- oracle-registry-state-updater (run each 2 minutes)
- streamr-listener (will listen on all data packages in the redstone-ecosystem and save it in DB) (will be disabled in nodes with direct posting)
- db-cleaner (will be launched every 1 hour, will remove too old data, e.g. data older than 7 days)

- Key differences
  - Now we will force each node operator to create a stream in the streamr network
  - Each node will broadcast data packages to the streamr network and additionally will broadcast them to 2 cache services hosted by RedStone (for faster data access)
  - Cache layer nodes will by default listen on streamr and cache data in DB
  - Thanks to streamr cache layers nodes will won't need to push data every 3 seconds, they can do it in the same way as before, in each iteration
  - RedStone community and partners will be able to launch cache services
  - We will use additional hosted uptime-kuma to notify developers in case of problems
    - There are 2 ways to handle this
      1. Use push monitor type with upside-down mode (push errors to the uptime-kuma service with helpful messages)
      2. Use HTTP keyword fetching, and add to cache-services some additonal `/status` endpoint
