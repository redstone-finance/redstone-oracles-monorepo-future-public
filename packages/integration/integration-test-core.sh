set -e # to exit when any command fails
set -x # to display commands during execution

export MONOREPO_INTEGRATION_TEST=true
MONGO_URI_FILE=./tmp-mongo-db-uri.log
CACHE_SERVICE_URL=http://localhost:3000
HARDHAT_MOCK_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
LAST_PID=

lazilyInstallNPMDeps() {
  if [ -d "node_modules" ]; then
    echo "Node modules are already installed. Skipping..."
  else
    echo "Installing NPM deps"
    yarn > /dev/null
    echo "Installed NPM deps"
  fi
}

lazilyBuildTypescript() {
  if [ -d "dist" ]; then
    echo "Already built. Skipping..."
  else
    echo "Building typescript"
    yarn build > /dev/null
    echo "Building completed"
  fi
}

installAndBuild() {
  lazilyInstallNPMDeps
  lazilyBuildTypescript
}

waitForFile() {
  filename=$1
  until [ -f $filename ]
  do
    sleep 5
  done
}

waitForUrl() {
  url=$1

  exitCode=1
  until [ $exitCode -eq 0 ]
  do
    sleep 5
    set +e # Allow the curl below to fail
    curl $url
    exitCode=$?
    set -e # Setting back to the mode with exiting when any command fails
  done
}

updateDotEnvFile() {
  varName=$1
  newValue=$(echo $2 | sed 's;/;\\/;g') # escaping all slashes
  find ./.env -type f -exec sed -i '' -e "/^$varName=/s/=.*/=\'$newValue\'/" {} \;
}

runWithLogPrefix() {
  cmd=$1
  logPrefix=$2
  $cmd > >(trap "" INT TERM; sed "s/^/$logPrefix: /") 2> >(trap "" INT TERM; sed "s/^/$logPrefix (stderr): /")
}

waitForDataPackages() {
  expectedDataPackageCount=$1
  feedId=$2
  runWithLogPrefix "yarn run-ts scripts/wait-for-data-packages.ts $expectedDataPackageCount $feedId" "Waiting $feedId"
}

main() {
  cd ../cache-service
  installAndBuild

  # Spinning up a mongo DB instance for cache service
  rm -f $MONGO_URI_FILE
  runWithLogPrefix "yarn run-ts scripts/launch-mongodb-in-memory.ts" "mongo-db" &
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
  runWithLogPrefix "yarn start" "cache-service" &
  cacheLayerPid=$!
  waitForUrl $CACHE_SERVICE_URL

  # Launching one iteration of oracle-node
  cd ../oracle-node
  installAndBuild
  cp .env.example .env
  updateDotEnvFile "OVERRIDE_DIRECT_CACHE_SERVICE_URLS" '["http://localhost:3000"]'
  updateDotEnvFile "OVERRIDE_MANIFEST_USING_FILE" "./manifests/single-source/mock.json"
  updateDotEnvFile "ECDSA_PRIVATE_KEY" $HARDHAT_MOCK_PRIVATE_KEY
  runWithLogPrefix "node dist/index.js" "oracle-node" &
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

  # Cleaning
  kill $cacheLayerPid
  kill $oracleNodePid
  pkill -f scripts/launch-mongodb-in-memory.ts
}

# Run the script
main
