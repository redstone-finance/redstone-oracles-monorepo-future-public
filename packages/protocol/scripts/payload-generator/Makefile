PAYLOAD_URL=https://d33trozg86ya9x.cloudfront.net/data-packages/payload?data-packages/payload?unique-signers-count=1&data-service-id=redstone-rapid-demo&data-feed-id=BTC,ETH,BNB,AR,AVAX,CELO&format=

DATA_DIR=./data
SHELL := /bin/bash

clean:
	rm -rf $(DATA_DIR)

# make DATA_NAME=test prepare_data
prepare_data:
	mkdir -p $(DATA_DIR)
	curl "$(PAYLOAD_URL)hex" > $(DATA_DIR)/${DATA_NAME}.hex &
	curl "$(PAYLOAD_URL)json" | cut -c 2- | sed 's/\\"/"/g' | sed 's/.$$//g' > $(DATA_DIR)/${DATA_NAME}.json &
	curl "$(PAYLOAD_URL)bytes" > $(DATA_DIR)/${DATA_NAME}.tmp  

	printf '{"bytes":' > $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.tmp >> $(DATA_DIR)/${DATA_NAME}.input 
	rm $(DATA_DIR)/${DATA_NAME}.tmp
	echo ',' >> $(DATA_DIR)/${DATA_NAME}.input 
	curl -L -H "Accept: application/json" unixtimesta.mp | cut -c 2- >> $(DATA_DIR)/${DATA_NAME}.input 
	cat $(DATA_DIR)/${DATA_NAME}.hex | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/ 0x/g' | cut -c 3- > $(DATA_DIR)/${DATA_NAME}.splitted
