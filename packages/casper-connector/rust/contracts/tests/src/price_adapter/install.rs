use casper_types::{runtime_args, Key, RuntimeArgs};

use redstone::helpers::hex::make_bytes;
use redstone_casper::contracts::constants::{
    ARG_NAME_SIGNERS, ARG_NAME_SIGNER_COUNT_THRESHOLD, ENTRY_POINT_INIT,
};

use crate::core::run_env::RunEnv;

impl RunEnv {
    pub(crate) const PRICE_ADAPTER_KEY: &'static str = "price_adapter";
    const PRICE_ADAPTER_WASM: &'static str = "price_adapter.wasm";

    pub(crate) fn deploy_price_adapter(&mut self) -> Key {
        self.deploy(Self::PRICE_ADAPTER_WASM, None)
    }

    pub(crate) fn install_price_adapter(
        &mut self,
        signers: Vec<&str>,
        signer_count_threshold: u8,
    ) -> Key {
        let contract_key = self.deploy_price_adapter();

        self.price_adapter_init(signers, signer_count_threshold);

        contract_key
    }

    pub(crate) fn install_default_price_adapter(&mut self) -> Key {
        self.install_price_adapter(
            vec![
                "0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB",
                "0x12470f7aba85c8b81d63137dd5925d6ee114952b",
                "0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
                "0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
                "0x2c59617248994D12816EE1Fa77CE0a64eEB456BF",
            ],
            1,
        )
    }

    pub(crate) fn price_adapter_init(&mut self, signers: Vec<&str>, signer_count_threshold: u8) {
        let args = runtime_args! {
            ARG_NAME_SIGNERS => make_bytes(signers, |s: &str| s.to_string()),
            ARG_NAME_SIGNER_COUNT_THRESHOLD => signer_count_threshold
        };

        self.call_entry_point(Self::PRICE_ADAPTER_KEY, ENTRY_POINT_INIT, args);
    }
}
