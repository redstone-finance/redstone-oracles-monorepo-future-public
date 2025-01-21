
prepare:
	rustup component add clippy rustfmt

clippy: prepare
	cargo clippy

fmt: prepare
	cargo fmt --all

fmt-check: prepare
	cargo fmt --all --check

lint: clippy fmt-check

build:
	anchor build

test: build
	anchor test
