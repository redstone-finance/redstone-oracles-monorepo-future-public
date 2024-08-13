REDSTONE_DIR=rust-sdk
REDSTONE_CASPER_DIR=redstone_casper
CONTRACTS_DIR=contracts
CONTRACTS := $(PRICE_ADAPTER) $(PRICE_FEED) $(PRICE_RELAY_ADAPTER)
ALL_TARGET_DIRS := $(CONTRACTS_DIR)/tests
CONTRACT_DIRS := $(addprefix $(CONTRACTS_DIR)/,$(CONTRACTS))
DIRS := $(REDSTONE_DIR) $(CONTRACT_DIRS) $(ALL_TARGET_DIRS) $(REDSTONE_CASPER_DIR)
CLEAN_DIRS := $(CONTRACTS_DIR)/tests
RUN_FEATURES=--features="print_debug"
CLIPPY=cargo clippy --release --fix --allow-dirty --allow-staged
DOC=cargo doc --no-deps --document-private-items
TEST=RUST_BACKTRACE=full cargo test --features="helpers"
FEATURE_SETS="crypto_k256" "crypto_k256,network_casper" "crypto_secp256k1" "crypto_secp256k1,network_casper"

define run_in_dirs
    $(foreach dir,$(1),$(shell cd $(dir) && $(2);))
endef

include input.mk
include scripts/defs.mk

prepare:
	@rustup target add wasm32-unknown-unknown

build_contracts: build-$(PRICE_ADAPTER) build-$(PRICE_FEED) build-$(PRICE_RELAY_ADAPTER)
	mkdir -p $(CONTRACTS_DIR)/tests/wasm
	@for contract in $(CONTRACTS); do \
		(cp target/wasm32-unknown-unknown/release/$$contract.wasm $(CONTRACTS_DIR)/tests/wasm); \
    done

build-%: prepare
	@cd $(CONTRACTS_DIR)/$* && (AR=llvm-ar CC=clang cargo build --release --target wasm32-unknown-unknown)
	@wasm-strip target/wasm32-unknown-unknown/release/$*.wasm 2>/dev/null | true

brun-%:
	cd $(CONTRACTS_DIR)/$* && (AR=llvm-ar CC=clang cargo build --release --target wasm32-unknown-unknown $(RUN_FEATURES))
	wasm-strip target/wasm32-unknown-unknown/release/$*.wasm 2>/dev/null | true
	mkdir -p $(CONTRACTS_DIR)/tests/wasm
	cp target/wasm32-unknown-unknown/release/$*.wasm $(CONTRACTS_DIR)/tests/wasm

run: brun-$(PRICE_ADAPTER) brun-$(CONTRACT)
	cd $(CONTRACTS_DIR)/tests && RUST_BACKTRACE=1 cargo run $(CONTRACT)

test: build_contracts
	@for features in $(FEATURE_SETS); do \
        echo "Running tests with features: $$features"; \
        (cd $(REDSTONE_DIR) && $(TEST) --features=$$features); \
    done
	cd $(CONTRACTS_DIR)/tests && cargo test

docs:
	@for features in $(FEATURE_SETS); do \
        echo "Documenting redstone with features: $$features"; \
        (rm -rf ./target/doc && cd $(REDSTONE_DIR) && $(DOC) --features=$$features && mkdir -p ../target/rust-docs/redstone && cp -r ../target/doc ../target/rust-docs/redstone/$$features); \
    done
	rm -rf ./target/doc && cd $(CONTRACTS_DIR)/$(PRICE_ADAPTER) && $(DOC) --target wasm32-unknown-unknown

coverage:
	cargo install grcov --version=0.5.15
	cd $(REDSTONE_DIR) && CARGO_INCREMENTAL=0 \
		RUSTFLAGS="-Zprofile -Ccodegen-units=1 -Copt-level=0 -Clink-dead-code -Coverflow-checks=off -Zpanic_abort_tests -Cpanic=abort" \
        RUSTDOCFLAGS="-Cpanic=abort" cargo build --features="crypto_k256"
	cd $(REDSTONE_DIR) && CARGO_INCREMENTAL=0 \
		RUSTFLAGS="-Zprofile -Ccodegen-units=1 -Copt-level=0 -Clink-dead-code -Coverflow-checks=off -Zpanic_abort_tests -Cpanic=abort" \
        RUSTDOCFLAGS="-Cpanic=abort" $(TEST) --features="crypto_k256"

.PHONY: run brun-%

clippy: prepare
	@for features in $(FEATURE_SETS); do \
        (cd $(REDSTONE_DIR) && $(CLIPPY) --all-targets --features=$$features -- -D warnings); \
    done

	$(call run_in_dirs,$(ALL_TARGET_DIRS),${CLIPPY} --all-targets -- -D warnings)
	$(call run_in_dirs,$(CONTRACT_DIRS),${CLIPPY} --target wasm32-unknown-unknown $(RUN_FEATURES) -- -D warnings)

check-lint: clippy
	$(call run_in_dirs,$(DIRS),cargo fmt -- --check)

lint: clippy
	$(call run_in_dirs,$(DIRS),cargo fmt)

clean:
	cargo clean
	$(call run_in_dirs,$(CLEAN_DIRS),rm -rf $(dir)/wasm)
