include ./scripts/defs.mk

CONTRACT=$(PRICE_ADAPTER)
SECRET_KEY=~/casper-keys/secret_key.pem

ifeq ($(CONTRACT), $(PRICE_FEED))
	DEPLOY_CSPR=80
	INIT_ARGS=--session-arg "adapter_address:key='hash-$(PRICE_ADAPTER_ADDRESS)'" \
			  --session-arg "feed_id:u256='$(ETH)'"
	INIT_CSPR=1
else
	PROCESS_PAYLOAD_CSPR=120#50
	PROCESS_PAYLOAD_ARGS=--session-args-json '$(shell cat ./scripts/args/adapter-process-payload-args.json | sed s,\#PAYLOAD\#,$(DATA_CAT),g)'
	ifeq ($(CONTRACT), $(PRICE_RELAY_ADAPTER))
		DEPLOY_CSPR=120
		INIT_ARGS=--session-arg "adapter_address:key='hash-$(PRICE_ADAPTER_ADDRESS)'"
		INIT_CSPR=2
		PROCESS_CHUNK_CSPR=3
	else
		DEPLOY_CSPR=430#160
		INIT_ARGS=--session-args-json '$(shell cat "./scripts/args/adapter-init-args.json")'
		INIT_CSPR=2
	endif
endif
