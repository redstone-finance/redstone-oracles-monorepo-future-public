CONTRACT_ADDRESS=$(shell cat "./$(CONTRACTS_DIR)/$(CONTRACT)/DEPLOYED.hex")

NODE_ADDRESS=--node-address http://52.35.59.254:7777

PUT_DEPLOY=@casper-client put-deploy $(NODE_ADDRESS) \
           		--chain-name casper-test \
           		--secret-key $(SECRET_KEY) \
             	--payment-amount

GET_DICT_ITEM=@casper-client get-dictionary-item $(NODE_ADDRESS) \
          		--state-root-hash $(shell casper-client get-state-root-hash $(NODE_ADDRESS) | node-jq -r ".result.state_root_hash") \
          		--contract-hash hash-$(shell make get_contract_key) \
          		--dictionary-name values \
          		--dictionary-item-key

GET_ITEM=@casper-client query-global-state $(NODE_ADDRESS) \
				--state-root-hash $(shell casper-client get-state-root-hash $(NODE_ADDRESS) | node-jq -r ".result.state_root_hash") \
				--key hash-$(shell make get_contract_key) \
				--query-path

GET_GLOBAL_ITEM=@casper-client query-global-state $(NODE_ADDRESS) \
				--state-root-hash $(shell casper-client get-state-root-hash $(NODE_ADDRESS) | node-jq -r ".result.state_root_hash") \
				--key

MOTE_ZEROS=000000000

get-state-root-hash:
	@casper-client get-state-root-hash $(NODE_ADDRESS)

get-deploy:
	@casper-client get-deploy $(NODE_ADDRESS) $(DEPLOY_HASH)

check-deploy:
	@./scripts/check-deploy.sh "$(shell cat ./scripts/DEPLOY_HASH)" "./$(CONTRACT)"

do_process_chunks:
	./scripts/process-chunks.sh

script-%:
	./scripts/check-deploy.sh $(shell ./scripts/deploy.sh "$*") "./$(CONTRACT)"

query_dict-%:
	$(GET_DICT_ITEM) "$*" | node-jq -r ".result.stored_value.CLValue.parsed"

query-%:
	$(GET_ITEM) "$*" | node-jq -r ".result.stored_value.CLValue.parsed"

get_contract_key:
	$(GET_GLOBAL_ITEM) hash-$(CONTRACT_ADDRESS) | \
    	node-jq -r '.result.stored_value.ContractPackage.versions | sort_by(.contract_version) | reverse | .[0] | .contract_hash' | sed 's/contract-//'

deploy: build-$(CONTRACT)
	$(PUT_DEPLOY) "$(DEPLOY_CSPR)$(MOTE_ZEROS)" \
	  --session-arg "contract_package_hash:opt_key=null" \
	  --session-path target/wasm32-unknown-unknown/release/$(CONTRACT).wasm

init:
	$(PUT_DEPLOY) "$(INIT_CSPR)$(MOTE_ZEROS)" \
		--session-package-hash "$(CONTRACT_ADDRESS)" \
		--session-entry-point "init" \
	  	$(INIT_ARGS)

upgrade: build-$(CONTRACT)
	$(PUT_DEPLOY) "$(DEPLOY_CSPR)$(MOTE_ZEROS)" \
	  --session-arg "contract_package_hash:opt_key='hash-$(CONTRACT_ADDRESS)'" \
	  --session-path target/wasm32-unknown-unknown/release/$(CONTRACT).wasm
