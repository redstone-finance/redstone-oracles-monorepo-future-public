#!/bin/bash

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
  until [ -f "$filename" ]
  do
    echo "$filename is not present, waiting..."
    sleep 5
  done
}

waitForUrl() {
  url=$1
  until curl "$url"
  do
    echo "$url is not responding, waiting..."
    sleep 5
  done
}

updateDotEnvFile() {
  varName=$1
  newValue=${2//\//\\/} # escaping all slashes
  # passing empty -i is not portable between GNU and mac so use portable workaround
  sed -i'.orig' -e "/^$varName=/s/=.*/=\'$newValue\'/" ./.env && rm -f ./.env.orig
}

runWithLogPrefix() {
  cmd=$1
  logPrefix=$2
  $cmd > >(trap "" INT TERM; sed "s/^/$logPrefix: /") 2> >(trap "" INT TERM; sed "s/^/$logPrefix (stderr): /")
}

runWithLogPrefixInBackground() {
  cmd=$1
  logPrefix=$2
  $cmd > >(trap "" INT TERM; sed "s/^/$logPrefix: /") 2> >(trap "" INT TERM; sed "s/^/$logPrefix (stderr): /") &
}

waitForDataPackages() {
  expectedDataPackageCount=$1
  feedId=$2
  runWithLogPrefix "yarn run-ts scripts/wait-for-data-packages.ts $expectedDataPackageCount $feedId" "Waiting $feedId"
}
