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
declare hardhatNodePid
declare onChainRelayerPid

stopAll() {
  set +e # ignore errors during cleanup, e.g. when process is already stopped
  [ -n "$onChainRelayerPid" ] && echo "stop on-chain-relayer" && kill -- -$onChainRelayerPid
  [ -n "$hardhatNodePid" ] && echo "stop hardhat node" && kill -- -$hardhatNodePid
  [ -n "$oracleNodePid" ] && echo "stop oracle-node" && kill -- -$oracleNodePid
  [ -n "$cacheLayerPid" ] && echo "stop cache-service" && kill -- -$cacheLayerPid
  [ -n "$mongoDbPid" ] && echo "stop mongo" && kill -- -$mongoDbPid
}

trap 'stopAll' EXIT


main() {
  cd ../evm-connector
  lazilyInstallNPMDeps
  yarn compile
  lazilyBuildTypescript

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

  # Compile on-chain-relayer
  cd ../on-chain-relayer
  lazilyInstallNPMDeps
  yarn compile
  lazilyBuildTypescript

  # Launch local EVM instance with hardhat
  runWithLogPrefixInBackground "yarn start-node" "hardhat-node"
  hardhatNodePid=$!
  until curl 127.0.0.1:8545; do # wait for hardhat to start blockchain instance
    sleep 1
  done
  yarn hardhat --network localhost run test/monorepo-integration-tests/scripts/deploy-mock-adapter.ts
  ADAPTER_CONTRACT_ADDRESS="$(cat adapter-contract-address.txt)"
  export ADAPTER_CONTRACT_ADDRESS

  # Launch on-chain-relayer
  cp .env.example .env
  updateDotEnvFile "RPC_URL" "http://127.0.0.1:8545"
  updateDotEnvFile "CHAIN_ID" "31337"
  updateDotEnvFile "PRIVATE_KEY" "$HARDHAT_MOCK_PRIVATE_KEY"
  updateDotEnvFile "ADAPTER_CONTRACT_ADDRESS" "$ADAPTER_CONTRACT_ADDRESS"
  updateDotEnvFile "DATA_FEEDS" '["BTC", "ETH", "AAVE"]'
  updateDotEnvFile "DATA_SERVICE_ID" "mock-data-service"
  updateDotEnvFile "CACHE_SERVICE_URLS" '["http://localhost:3000"]'
  updateDotEnvFile "HEALTHCHECK_PING_URL" ""
  cat .env
  runWithLogPrefixInBackground "yarn start" "on-chain-relayer"
  onChainRelayerPid=$!

  # Verify prices on-chain
  until runWithLogPrefix "yarn hardhat --network localhost run test/monorepo-integration-tests/scripts/verify-mock-prices.ts" "relayer-contract"
  do
    # wait for relayer to put data on-chain
    sleep 5
  done

  # Cleanup
  trap -- EXIT
  stopAll
}

# Run the script
main
