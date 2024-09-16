#!/bin/bash

file="./scripts/sample-data/payload.hex"
chunk_size=1750
total_size=$(wc -c <"$file")
total_chunks=$(((total_size + chunk_size - 1) / chunk_size))

# shellcheck disable=SC2002
hash=$(cat "$file" | ts-node "./scripts/blake2b.ts")

get_cspr_value() {
  local chunk_index=$1

  if [ "$chunk_index" -eq $((total_chunks - 1)) ]; then
    echo "PROCESS_PAYLOAD_CSPR"
  else
    echo "PROCESS_CHUNK_CSPR"
  fi
}

chunk_index=0
while [ "$total_size" -gt 0 ]; do
  chunk=$(dd if="$file" bs=$chunk_size skip=$chunk_index count=1 2>/dev/null)

  cspr_value=$(get_cspr_value $chunk_index)

  export CHUNK_INDEX="$chunk_index"
  export PAYLOAD="$chunk"
  export HASH="$hash"
  export CSPR_VALUE="$cspr_value"

  make script-process_chunk

  ((chunk_index++))
  ((total_size -= chunk_size))
done
