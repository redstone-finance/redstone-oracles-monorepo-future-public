#!/bin/bash

source ./integration-test-common.sh

set -euo pipefail # to exit when any command fails
set -x # to display commands during execution
set -m # to make each command started in background a separate process group so that we can send signals to all the processes in group at once (using negative pids)


export MONOREPO_INTEGRATION_TEST=true
MONGO_URI_FILE=./tmp-mongo-db-uri.log
CACHE_SERVICE_URL=http://localhost:3000
HARDHAT_MOCK_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

declare mongoDbPid
declare cacheLayerPid
declare oracleNodePid

stopAll() {
  [ -n "$oracleNodePid" ] && kill -- -$oracleNodePid
  [ -n "$cacheLayerPid" ] && kill -- -$cacheLayerPid
  [ -n "$mongoDbPid" ] && kill -- -$mongoDbPid
}

trap 'stopAll' EXIT


main() {
  cd ../cache-service
  installAndBuild

  # Spinning up a mongo DB instance for cache service
  rm -f $MONGO_URI_FILE
  runWithLogPrefixInBackground "yarn run-ts scripts/launch-mongodb-in-memory.ts" "mongo-db"
  mongoDbPid=$!
  waitForFile $MONGO_URI_FILE
  MEMORY_MONGO_DB_URL=$(cat $MONGO_URI_FILE)

  # Run cache layer
  cp .env.example .env
  updateDotEnvFile "MONGO_DB_URL" "$MEMORY_MONGO_DB_URL"
  updateDotEnvFile "API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES" "hehe"
  updateDotEnvFile "ENABLE_DIRECT_POSTING_ROUTES" "true"
  updateDotEnvFile "ENABLE_STREAMR_LISTENING" "false"
  updateDotEnvFile "USE_MOCK_ORACLE_STATE" "true"
  cat .env
  runWithLogPrefixInBackground "yarn start" "cache-service"
  cacheLayerPid=$!
  waitForUrl $CACHE_SERVICE_URL

  # Launching one iteration of oracle-node
  cd ../oracle-node
  installAndBuild
  cp .env.example .env
  updateDotEnvFile "OVERRIDE_DIRECT_CACHE_SERVICE_URLS" '["http://localhost:3000"]'
  updateDotEnvFile "OVERRIDE_MANIFEST_USING_FILE" "./manifests/single-source/mock.json"
  updateDotEnvFile "ECDSA_PRIVATE_KEY" $HARDHAT_MOCK_PRIVATE_KEY
  cat .env
  runWithLogPrefixInBackground "yarn start" "oracle-node"
  oracleNodePid=$!

  # Waiting for data packages to be available in cache service
  cd ../cache-service
  waitForDataPackages 1 ___ALL_FEEDS___
  waitForDataPackages 1 ETH
  waitForDataPackages 1 BTC
  waitForDataPackages 1 AAVE

  # Querying data packages from cache service
  curl http://localhost:3000/data-packages/latest/mock-data-service

  # Using data in evm-connector
  cd ../evm-connector
  lazilyInstallNPMDeps
  yarn compile
  lazilyBuildTypescript
  runWithLogPrefix "yarn test test/monorepo-integration-tests/localhost-mock.test.ts" "evm-connector"

  # Cleanup
  trap -- EXIT
  stopAll
}

# Run the script
main
