
CAIRO_DATA_DIR=demo/src
DATA_NAME=test

DATA_DIR=../../protocol/scripts/payload-generator/data

REDSTONE_DIR=redstone
CONTRACTS_DIR=contracts
CONTRACTS := price_adapter price_feed price_rounds_adapter price_rounds_feed utils interface
CONTRACT_DIRS := $(addprefix $(CONTRACTS_DIR)/,$(CONTRACTS))
DIRS := $(REDSTONE_DIR) $(CONTRACT_DIRS)

define run_in_dirs
    for dir in $(1); do \
        (cd $$dir && $(2)) || exit 1; \
    done
endef

prepare:
	@echo ""

format: prepare
	$(call run_in_dirs,$(DIRS),scarb fmt)

build: prepare
	$(call run_in_dirs,$(DIRS),scarb build --verbose)

run: format
	cd demo && scarb cairo-run

tests: format
	$(call run_in_dirs,$(DIRS),scarb test)

clean:
	$(call run_in_dirs,$(DIRS),rm -rf target)
	rm -rf sample-data

get_data: 
	make -C ../../sdk/scripts/payload-generator DATA_NAME=$(DATA_NAME) prepare_data
	cp ../../sdk/scripts/payload-generator/data/$(DATA_NAME).hex $(CAIRO_DATA_DIR)/$(DATA_NAME).hex
	cp ../../sdk/scripts/payload-generator/data/$(DATA_NAME).time $(CAIRO_DATA_DIR)/$(DATA_NAME).time
	mkdir -p sample-data
	cp ../../sdk/scripts/payload-generator/data/$(DATA_NAME).split sample-data/$(DATA_NAME).split

prepare_data: BLOCK_TIMESTAMP=$(shell cat $(CAIRO_DATA_DIR)/${DATA_NAME}.time  | grep -o '"timestamp":\d*' | cut -d':' -f2)

prepare_data: get_data
	echo -n "" >  $(CAIRO_DATA_DIR)/${DATA_NAME}.cairo;
	echo -e "use core::array::ArrayTrait;\n" >> $(CAIRO_DATA_DIR)/${DATA_NAME}.cairo
	echo -e 'pub(crate) const SAMPLE_BLOCK_TIMESTAMP: u64 = ${BLOCK_TIMESTAMP}_u64;\n' >> $(CAIRO_DATA_DIR)/${DATA_NAME}.cairo
	echo -e "pub(crate) fn sample_payload_bytes() -> Array<u8> {\n    let mut arr: Array<u8> = ArrayTrait::new();" >> $(CAIRO_DATA_DIR)/${DATA_NAME}.cairo
	(echo -n "0x" && cat $(CAIRO_DATA_DIR)/${DATA_NAME}.hex) | fold -w2 | paste -sd' ' -  | sed -E 's/[[:space:]]+/_u8);\n    arr.append(0x/g' | sed 1d >> $(CAIRO_DATA_DIR)/${DATA_NAME}.cairo
	echo -e "_u8);\n    arr\n}\n" >> $(CAIRO_DATA_DIR)/${DATA_NAME}.cairo
