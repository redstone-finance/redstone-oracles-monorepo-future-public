MULTI_FEED_PRICE_ADAPTER=multi_feed_price_adapter
PRICE_ADAPTER=multi_feed_price_adapter
PRICE_FEED=price_feed
PROXY=proxy
BADGE_CREATOR=badge_creator

CONTRACT ?= $(MULTI_FEED_PRICE_ADAPTER)

define get_features
	$(if $(filter $(1),$(PRICE_ADAPTER)),--features=real_network, \
	$(if $(filter $(1),$(MULTI_FEED_PRICE_ADAPTER)),--features=real_network, \
	$(if $(filter $(1),$(PRICE_FEED)),--features=real_network,)))
endef

define get_sim_features
	$(if $(filter $(1),$(PRICE_ADAPTER)),--features=test_sim_env, \
	$(if $(filter $(1),$(MULTI_FEED_PRICE_ADAPTER)),--features=test_sim_env, ))
endef

CONTRACTS := $(PRICE_ADAPTER) $(PRICE_FEED) $(MULTI_FEED_PRICE_ADAPTER) $(PROXY) $(BADGE_CREATOR)
CONTRACTS_DIR=./contracts
CONTRACT_DIR=$(CONTRACTS_DIR)/$(CONTRACT)
DEPLOYED_DIR=$(CONTRACT_DIR)/deployed
PACKAGE_ADDRESS=$(shell cat $(DEPLOYED_DIR)/package.resim.addr)
COMPONENT_ADDRESS=$(shell cat $(DEPLOYED_DIR)/component.resim.addr)
PRICE_ADAPTER_ADDRESS=$(shell cat $(CONTRACTS_DIR)/$(PRICE_ADAPTER)/deployed/component.resim.addr)
PRICE_FEED_ADDRESS=$(shell cat $(CONTRACTS_DIR)/$(PRICE_FEED)/deployed/component.resim.addr)
PROXY_ADDRESS=$(shell cat $(CONTRACTS_DIR)/$(PROXY)/deployed/component.resim.addr)

ACCOUNT=$(shell resim show | sed -n 's/Component Address.*\(account_[a-zA-Z0-9]*\).*/\1/p')
OWNER_BADGE=$(shell resim show | sed -n 's/.*\(resource_[a-zA-Z0-9]*\).*: 1 Owner Badge/\1\:\#1\#/p')

FEATURE_SETS="crypto_secp256k1" "crypto_secp256k1,network_radix"
WASM32_FEATURE_SETS="crypto_radix" "crypto_radix,network_radix"
REDSTONE_DIR=rust-sdk
TEST=RUST_BACKTRACE=full cargo test --features="helpers"
CLIPPY=cargo clippy --release --fix --allow-dirty --allow-staged --allow-no-vcs

DATA_NAME=radix
DATA_DIR=../../sdk/scripts/payload-generator
DATA_CAT=$(shell cat ${DATA_DIR}/data/${DATA_NAME}.hex)
PAYLOAD=$(shell cat ./sample-data/payload.hex)
TIMESTAMP=$(shell cat $(DATA_DIR)/data/$(DATA_NAME).time | node-jq -r ".timestamp")

.PHONY:

prepare:
	@rustup target add wasm32-unknown-unknown
	cargo install wasm-bindgen-cli wasm-pack

build: $(foreach contract, $(CONTRACTS), build-$(contract))

build-%: prepare
	cargo build --package $* $(call get_features, $*)
	scrypto build --path $(CONTRACTS_DIR)/$* $(call get_features, $*)
	cp ./target/wasm32-unknown-unknown/release/$*.rpd $(CONTRACTS_DIR)/$*/artifacts/
	cp ./target/wasm32-unknown-unknown/release/$*_with_schema.wasm $(CONTRACTS_DIR)/$*/artifacts/

publish: clippy
	resim publish $(CONTRACT_DIR) | tee | grep -o 'package_[a-zA-Z0-9]*' > $(DEPLOYED_DIR)/package.resim.addr

instantiate-%:
	resim call-function $(OPTS) $(PACKAGE_ADDRESS) $* instantiate $(ARGS) > output.tmp
	cat output.tmp | grep -o 'component_[a-zA-Z0-9]*' | tail -n 1 > $(DEPLOYED_DIR)/component.resim.addr
	cat output.tmp | grep -o 'resource_[a-zA-Z0-9]*' | tail -n 1 > $(DEPLOYED_DIR)/owner.resim.addr
	rm output.tmp

deploy-%: publish
	make instantiate-$*

call-%:
	resim call-method $(COMPONENT_ADDRESS) $* $(ARGS) $(PROOFS)

test: clippy
	@for contract in $(CONTRACTS); do \
		cargo test --package  $$contract; \
		FORCE_REAL_NETWORK_TEST=true cargo test --package  $$contract $* $(call get_features, $$contract); \
		FORCE_REAL_NETWORK_TEST=true cargo test --package  $$contract $* $(call get_features, $$contract) $(call get_sim_features, $$contract); \
	done

	@for features in $(FEATURE_SETS); do \
        echo "Running tests with features: $$features"; \
        ($(TEST) --package redstone --features=$$features); \
    done

	@for features in $(WASM32_FEATURE_SETS); do \
		echo "Running wasm32 tests with features: $$features"; \
		(cd $(REDSTONE_DIR) && wasm-pack test --node --features="helpers" --features=$$features); \
	done

clippy: prepare
	@for features in $(FEATURE_SETS); do \
        (cd $(REDSTONE_DIR) && $(CLIPPY) --all-targets --features=$$features -- -D warnings); \
    done

	@for contract in $(CONTRACTS); do \
		$(CLIPPY) --package $$contract; \
		$(CLIPPY) --package $$contract $(call get_features, $$contract); \
		$(CLIPPY) --package $$contract $(call get_features, $$contract) $(call get_sim_features, $$contract); \
	done

check-lint: clippy
	cargo fmt -- --check

lint: clippy
	cargo fmt

get_data:
	make -C $(DATA_DIR) DATA_NAME=$(DATA_NAME) prepare_data

prepare_data: get_data
	printf "${DATA_CAT}" > ./sample-data/payload.hex

update_data: prepare_data
	resim set-current-time "$(shell date -u +'%Y-%m-%dT%H:%M:%SZ')"

deploy_adapter: publish
	make instantiate-PriceAdapter ARGS="1 12470f7aba85c8b81d63137dd5925d6ee114952b,109B4a318A4F5ddcbCA6349B45f881B4137deaFB,1ea62d73edf8ac05dfcea1a34b9796e937a29eff,2c59617248994D12816EE1Fa77CE0a64eEB456BF,83cba8c619fb629b81a65c2e67fe15cf3e3c9747,f786a909d559f5dee2dc6706d8e5a81728a39ae9"

deploy_multi_feed_adapter: publish
	make instantiate-MultiFeedPriceAdapter ARGS="1 12470f7aba85c8b81d63137dd5925d6ee114952b,109B4a318A4F5ddcbCA6349B45f881B4137deaFB,1ea62d73edf8ac05dfcea1a34b9796e937a29eff,2c59617248994D12816EE1Fa77CE0a64eEB456BF,83cba8c619fb629b81a65c2e67fe15cf3e3c9747,f786a909d559f5dee2dc6706d8e5a81728a39ae9"

deploy_feed: publish
	make instantiate-PriceFeed ARGS="$(PRICE_ADAPTER_ADDRESS) ETH"

deploy_proxy: publish
	ACCOUNT=$(ACCOUNT) PACKAGE_ADDRESS=$(PACKAGE_ADDRESS) OWNER_BADGE="$(OWNER_BADGE)" MANAGER_BADGE="$(OWNER_BADGE)" resim run $(CONTRACT_DIR)/manifests/instantiate.rtm > output.tmp
	cat output.tmp | grep -o 'component_[a-zA-Z0-9]*' | tail -n 1 > $(DEPLOYED_DIR)/component.resim.addr
	cat output.tmp | grep -o 'resource_[a-zA-Z0-9]*' | tail -n 1 > $(DEPLOYED_DIR)/owner.resim.addr
	rm output.tmp

set_contract_address:
	make call-set_global_contract_address ARGS="$(PRICE_FEED_ADDRESS)" PROOFS="--proofs $(OWNER_BADGE)"

get_prices:
	make call-get_prices ARGS="ETH,BTC $(PAYLOAD)" | sed -n '/Outputs:/,/Balance Changes:/p' | sed '/Balance Changes:/d'

write_prices:
	make call-write_prices ARGS="ETH,BTC $(PAYLOAD)" | sed -n '/Outputs:/,/Balance Changes:/p' | sed '/Balance Changes:/d'

read_prices:
	make call-read_prices ARGS="ETH,BTC" | sed -n '/Outputs:/,/Balance Changes:/p' | sed '/Balance Changes:/d'

read_timestamp:
	make call-read_timestamp ARGS="" | sed -n '/Outputs:/,/Balance Changes:/p' | sed '/Balance Changes:/d'

read_price_and_timestamp:
	make call-read_price_and_timestamp ARGS="" | sed -n '/Outputs:/,/Balance Changes:/p' | sed '/Balance Changes:/d'

read_price_and_timestamp_proxy:
	ACCOUNT=$(ACCOUNT) PROXY_ADDRESS=$(PROXY_ADDRESS) resim run $(PROXY)/manifests/read_price_and_timestamp.rtm  | sed -n '/Outputs:/,/Balance Changes:/p' | sed '/Balance Changes:/d'

show:
	resim show

create_badges: publish
	resim call-function $(PACKAGE_ADDRESS) "BadgeCreator" create_badges
