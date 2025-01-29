
DATA_GENERATOR=../../../packages/sdk/scripts/payload-generator
DATA_DIR=$(DATA_GENERATOR)/data
PUBLIC_KEY=movement config show-profiles --profile default | jq .Result.default.account
ADAPTER_ADDRESS=yarn price-adapter-address $(shell $(PUBLIC_KEY))

# ignored so clean will always run
.IGNORE: install-movement clean

install-cli: install-movement clean

install-movement:
	git clone https://github.com/movementlabsxyz/aptos-core.git	
	cd aptos-core && git checkout movement-cli-v3.5.0
	cd aptos-core && cargo install --locked --bin movement --path crates/aptos --profile cli

clean:
	rm -rf aptos-core

init-movement:
	movement init --skip-faucet

default-public-key:
	$(PUBLIC_KEY)

adapter-address:
	$(ADAPTER_ADDRESS)

test:
	movement move test --package-dir contracts/price_feed
	movement move test --package-dir contracts/price_adapter

build:
	movement move build --package-dir contracts/price_feed --dev
	movement move build --package-dir contracts/price_adapter --dev

deploy-price-adapter:
	movement move publish  --package-dir contracts/price_adapter --named-addresses redstone_price_adapter=default

deploy-price-feed:
	movement move publish  --package-dir contracts/price_feed --named-addresses redstone_price_adapter=default,price_feed=default,price_adapter_object_address=$(shell $(ADAPTER_ADDRESS))

prepare-data:
	make -C $(DATA_GENERATOR) DATA_NAME=$(DATA_NAME) prepare_data

data: prepare-data
	cat $(DATA_DIR)/$(DATA_NAME).hex

write-sample-data: prepare-data
	movement move run --function-id "default::price_adapter::write_price" --args "address:$(shell $(ADAPTER_ADDRESS))" "hex:0x4554480000000000000000000000000000000000000000000000000000000000" "hex:$(shell cat $(DATA_DIR)/$(DATA_NAME).hex)"

read-price:
	movement move view --function-id default::price_feed::read_price

read-price-timestamp:
	movement move view --function-id default::price_feed::read_price_and_timestamp

read-timestamp:
	movement move view --function-id default::price_feed::read_timestamp
