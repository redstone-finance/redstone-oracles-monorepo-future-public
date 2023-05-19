
DATA_NAME=fuel
IS_LOCAL=1

CONTRACT_ID=0x8fdae6cb766121b5382977e98dc948dbdc95812a3e60c2cf2c0dfff06e877989

ifeq ($(IS_LOCAL), 0)
#	SIGNING_KEY= # forc-wallet account 0
	NODE_URL=beta-3.fuel.network/graphql 
	GAS_PRICE=1
else
	SIGNING_KEY=--unsigned
	NODE_URL=127.0.0.1:4000
	GAS_PRICE=0
endif

DEMO=sway/demo
CONTRACT=sway/contract
INVOKER=sway/contract_invoker
INITIALIZER=sway/contract_initializer
LIBRARY=sway/redstone
DATA_GENERATOR=../../packages/protocol/scripts/payload-generator
DATA_DIR=$(DATA_GENERATOR)/data

format:
	cd $(DEMO) && forc-fmt
	cd $(CONTRACT) && forc-fmt
	cd $(INVOKER) && forc-fmt
	cd $(INITIALIZER) && forc-fmt
	cd $(LIBRARY) && forc-fmt

run: format
	cd $(DEMO) && forc run --unsigned -r \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex)

# make SIGNING_KEY=5b4 invoke
invoke: format
	cd $(INVOKER) && forc run -r \
	--data $(shell cat $(DATA_DIR)/$(DATA_NAME).hex) \
	--node-url $(NODE_URL) \
	--contract $(CONTRACT_ID) \
	--gas-limit 100000000 \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY) 

contract: format
	cd $(CONTRACT) && forc build

# make SIGNING_KEY=5b4 invoke
deploy: format
	echo "For the beta-2 node the 'forc' version must not be greater than 0.34.0"
	cd $(CONTRACT) && forc deploy --terse \
	--node-url $(NODE_URL) \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

init: format
	cd $(INITIALIZER) && forc run -r \
	--data 0x0$(IS_LOCAL) \
	--node-url $(NODE_URL) \
	--contract $(CONTRACT_ID) \
	--gas-limit 100000000 \
	--gas-price $(GAS_PRICE) $(SIGNING_KEY)

test: format
	cd $(LIBRARY) && forc test

prepare_data:
	make -C $(DATA_GENERATOR) DATA_NAME=$(DATA_NAME) prepare_data
