
DATA_NAME=fuel
IS_LOCAL=1
IS_MAINNET=0

SALT_ID=0x0000000000000000000000000000000000000000000000000000000000000002
SUFFIX=_prices#_prices#_core#_adapter

ifeq ($(IS_LOCAL), 0)
	ifeq ($(IS_MAINNET), 1)
		NODE_URL=--node-url https://$(API_CREDENTIALS)mainnet.fuel.network/v1/graphql
	else
		NODE_URL=--target testnet
	endif
	GAS_PRICE=1
else
	SIGNING_KEY=--default-signer
	NODE_URL=--target local
	GAS_PRICE=0
endif

CONTRACT=contract$(SUFFIX)
INVOKER=invoker
SALT=--salt $(SALT_ID)

ifeq ($(SUFFIX),_core)
  INVOKER=invoker$(SUFFIX)
endif

DEMO=demo
CONTRACT_PRICES=contract_prices
CONTRACT_CORE=contract_core
CONTRACT_ADAPTER=contract_adapter
COMMON=common
LIBRARY=redstone-fuel-sdk
DATA_GENERATOR=../../../packages/sdk/scripts/payload-generator
DATA_DIR=$(DATA_GENERATOR)/data
CONTRACT_ID_FILE=./$(CONTRACT)/CONTRACT_ID
CONTRACT_ID=$(shell cat $(CONTRACT_ID_FILE))
TEST_DIRS = $(LIBRARY)
DIRS = $(CONTRACT) $(CONTRACT_PRICES) $(CONTRACT_CORE) $(CONTRACT_ADAPTER) $(INVOKER) $(DEMO) $(COMMON) $(TEST_DIRS) 
TOML_FILE = ./$(CONTRACT)/Forc.toml
PROXY_ADDRESS=$(shell grep -E '^\s*address\s*=' $(TOML_FILE) | sed -E 's/.*"0x([0-9a-fA-F]+)".*/0x\1/')

define run_in_dirs
    for dir in $(1); do \
        ($(2) --path $$dir) || exit 1; \
    done
endef

.PHONY: contract_id get_contract_id format

format:
	$(call run_in_dirs,$(DIRS),forc fmt)

lint:
	$(call run_in_dirs,$(DIRS),forc fmt --check)

build: format
	$(call run_in_dirs,$(DIRS),forc build)

run: format
	forc run --path $(DEMO) -r $(SIGNING_KEY) \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex)

# make SIGNING_KEY=5b4 invoke
invoke: format
	forc run --path $(INVOKER) -r \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex) \
	--script-gas-limit 25000000 \
	$(NODE_URL) \
	--contract $(CONTRACT_ID) \
	--contract $(PROXY_ADDRESS) \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

contract: format
	forc --version --path $(CONTRACT)
	forc build --path $(CONTRACT) --release

# make SIGNING_KEY=5b4 invoke
perform_deploy: format
	@forc deploy --version
	forc deploy --path $(CONTRACT) --terse \
	$(SALT) \
	$(NODE_URL) \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

get_contract_id:
	forc contract-id --path $(CONTRACT) --terse --release $(SALT) | grep "Contract id:" | cut -c 20- > $(CONTRACT_ID_FILE) 

contract_id: get_contract_id
	@cat $(INVOKER)/src/main.sw | sed -E "s|CONTRACT_ID: b256 = (0x([0-9a-f])+)*,|CONTRACT_ID: b256 = $(PROXY_ADDRESS),|g" > tmp.sw
	@mv tmp.sw $(INVOKER)/src/main.sw

deploy: perform_deploy contract_id

test: format
	$(call run_in_dirs,$(TEST_DIRS),forc test)

prepare_data:
	make -C $(DATA_GENERATOR) DATA_NAME=$(DATA_NAME) prepare_data

run_local_node:
	fuel-core run --debug --db-type in-memory
