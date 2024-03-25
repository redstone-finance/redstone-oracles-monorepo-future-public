DATA_NAME=casper
DATA_DIR=../../sdk/scripts/payload-generator
DATA_CAT=$(shell cat ${DATA_DIR}/data/${DATA_NAME}.hex)
DATA_HASH=$(shell cat "./scripts/sample-data/payload.hex" | ts-node "./scripts/blake2b.ts")

get_data:
	make -C $(DATA_DIR) DATA_NAME=$(DATA_NAME) prepare_data

prepare_data: get_data
	printf "${DATA_CAT}" > ./scripts/sample-data/payload.hex
