use crate::env::{run_env::PriceAdapterRunEnv, run_mode::RunMode, test_env::IntoT};
use price_adapter::{price_adapter::price_adapter_test::PriceAdapterState, types::*};
use scrypto_test::prelude::*;
use std::fmt::Debug;

const PRICE_ADAPTER: &str = "PriceAdapter";
const ENTRY_POINT_INSTANTIATE: &str = "instantiate_with_mock_timestamp";
const ENTRY_POINT_READ_TIMESTAMP: &str = "read_timestamp";
const ENTRY_POINT_READ_PRICES: &str = "read_prices";
const ENTRY_POINT_GET_PRICES: &str = "get_prices";
const ENTRY_POINT_WRITE_PRICES: &str = "write_prices";

pub(crate) struct PriceAdapterSimEnv {
    component: ComponentAddress,
    public_key: Secp256k1PublicKey,
    ledger: LedgerSimulator<NoExtension, InMemorySubstateDatabase>,
}

impl PriceAdapterRunEnv for PriceAdapterSimEnv {
    fn instantiate(unique_signer_count: u8, signers: Signers, timestamp: Option<u64>) -> Self {
        let mut ledger = LedgerSimulatorBuilder::new().build();
        let (public_key, _private_key, _) = ledger.new_allocated_account();
        let package_address = ledger.compile_and_publish(this_package!());

        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .call_function(
                package_address,
                PRICE_ADAPTER,
                ENTRY_POINT_INSTANTIATE,
                manifest_args!(unique_signer_count, signers, timestamp),
            )
            .build();
        let receipt = ledger.execute_manifest(
            manifest,
            vec![NonFungibleGlobalId::from_public_key(&public_key)],
        );

        let component = receipt.expect_commit_success().new_component_addresses()[0];

        Self {
            component,
            ledger,
            public_key,
        }
    }

    fn state(&self) -> PriceAdapterState {
        self.ledger
            .component_state::<PriceAdapterState>(self.component)
    }

    fn read_timestamp(&mut self) -> u64 {
        self.call_method(ENTRY_POINT_READ_TIMESTAMP, manifest_args!())
    }

    fn read_prices(&mut self, feed_ids: FeedIds) -> Vec<redstone::network::specific::U256> {
        self.call_method::<Vec<U256Digits>>(ENTRY_POINT_READ_PRICES, manifest_args!(feed_ids))
            .into_t()
    }

    fn process_payload(
        &mut self,
        run_mode: RunMode,
        payload: Payload,
        feed_ids: FeedIds,
        _timestamp: u64,
    ) -> (u64, Vec<U256>) {
        let (timestamp, values): (_, Vec<U256Digits>) = self.call_method(
            if run_mode == RunMode::Get {
                ENTRY_POINT_GET_PRICES
            } else {
                ENTRY_POINT_WRITE_PRICES
            },
            manifest_args!(feed_ids, payload),
        );

        (timestamp, values.into_t())
    }

    fn increase_time(&mut self) {
        // nop here
    }
}

impl PriceAdapterSimEnv {
    fn call_method<V: ScryptoDecode + Eq + Debug>(
        &mut self,
        name: &str,
        args: impl ResolvableArguments,
    ) -> V {
        let manifest = ManifestBuilder::new()
            .lock_fee_from_faucet()
            .call_method(self.component, name, args)
            .build();
        let receipt = self.ledger.execute_manifest(
            manifest,
            vec![NonFungibleGlobalId::from_public_key(&self.public_key)],
        );

        let outputs = receipt.expect_commit_success().outcome.expect_success();

        Self::decode(outputs[1].clone())
    }

    fn decode<V: ScryptoDecode + Eq + Debug>(output: InstructionOutput) -> V {
        match output {
            InstructionOutput::CallReturn(buf) => {
                scrypto_decode(buf.as_slice()).expect("Value does not decode to type")
            }
            InstructionOutput::None => {
                panic!("Expected value but was None");
            }
        }
    }
}
