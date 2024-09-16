#!/bin/bash

JQ=node-jq

while true; do
  result=$(make DEPLOY_HASH="$1" get-deploy)

  execution_results=$(echo "$result" | $JQ '.result.execution_results')

  if [[ $execution_results != "[]" ]]; then
    echo "$result" | $JQ '.result.execution_results.[0].result' | $JQ 'if .Success then .Success.effect.transforms |= map(select(.transform != "Identity" and (.key | startswith("balance-") | not))) else . end | if .Failure then .Failure.effect.transforms |= map(select(.transform != "Identity" and (.key | startswith("balance-") | not))) else . end'
    deploy_hash=$(echo "$result" | $JQ '.result.execution_results.[0].result' | $JQ 'if .Success then .Success.effect.transforms.[] | select(.transform == "WriteContractPackage") | {(.transform): .key} else . end | if .Failure then {} else . end' | $JQ -r 'if has("WriteContractPackage") then .WriteContractPackage else "" end' | sed 's/hash-//' | uniq)
    if [[ -n $deploy_hash ]]; then
      echo "$deploy_hash" | tee "contracts/$2/DEPLOYED.hex"
    fi
    break
  else
    echo "execution_results is empty, waiting 10 sec..."
  fi

  sleep 10
done
