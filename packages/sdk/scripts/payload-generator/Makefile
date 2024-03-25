
DATA_DIR=./data
SHELL := /bin/bash

clean:
	rm -rf $(DATA_DIR)

# make DATA_NAME=test prepare_data
fetch_data:
	mkdir -p $(DATA_DIR)
	ts-node index.ts > $(DATA_DIR)/${DATA_NAME}.hex &
	ts-node index.ts "json" > $(DATA_DIR)/${DATA_NAME}.json &
	ts-node index.ts "bytes" > $(DATA_DIR)/${DATA_NAME}.tmp

prepare_data: fetch_data
	printf '{"bytes":' > $(DATA_DIR)/${DATA_NAME}.input
	cat $(DATA_DIR)/${DATA_NAME}.tmp >> $(DATA_DIR)/${DATA_NAME}.input
	rm $(DATA_DIR)/${DATA_NAME}.tmp
	printf ',' >> $(DATA_DIR)/${DATA_NAME}.input
	curl -L -H "Accept: application/json" unixtimesta.mp | cut -c 2- >> $(DATA_DIR)/${DATA_NAME}.input
	cat $(DATA_DIR)/${DATA_NAME}.hex | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/ 0x/g' | cut -c 3- > $(DATA_DIR)/${DATA_NAME}.split
