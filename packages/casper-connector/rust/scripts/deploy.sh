#!/bin/bash

JQ=node-jq

result=$(make "$1")
execution_results=$(echo "$result" | $JQ 'if has("result") then .result.deploy_hash else "" end')
if [[ -n $execution_results ]]; then
  echo "${execution_results}" | tee ./scripts/DEPLOY_HASH
else
  echo "${result}"
  exit 1
fi
