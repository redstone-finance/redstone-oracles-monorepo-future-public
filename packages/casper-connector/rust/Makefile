include ./scripts/defs.mk
include input.mk
include ./scripts/build.mk
include ./scripts/data.mk
include ./scripts/casper.mk

deploy_and_init: script-deploy script-init

put_write_prices:
	$(PUT_DEPLOY) "$(PROCESS_PAYLOAD_CSPR)$(MOTE_ZEROS)" \
		--session-package-hash $(CONTRACT_ADDRESS) \
		--session-entry-point "write_prices" \
		$(PROCESS_PAYLOAD_ARGS)

read_eth_price: query_dict-ETH

get_eth_price_and_timestamp: script-get_price_and_timestamp query-value query-timestamp

process_chunk:
	$(PUT_DEPLOY) "${$(CSPR_VALUE)}$(MOTE_ZEROS)" \
		--session-package-hash $(CONTRACT_ADDRESS) \
		--session-entry-point "get_prices_chunk" \
		--session-args-json '$(shell cat ./scripts/args/relay-adapter-process-chunk-args.json | sed s,\#PAYLOAD\#,$(PAYLOAD),g | sed s,\#CHUNK_INDEX\#,$(CHUNK_INDEX),g | sed s,\#HASH\#,$(HASH),g)'

process_chunks: do_process_chunks read_chunk

write_prices: script-put_write_prices read_eth_price

get_price_and_timestamp:
	$(PUT_DEPLOY) "1$(MOTE_ZEROS)" \
		--session-package-hash "$(PRICE_FEED_ADDRESS)" \
		--session-entry-point "get_price_and_timestamp"

read_chunk: query_dict-$(DATA_HASH)


