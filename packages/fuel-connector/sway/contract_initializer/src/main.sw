script;

use std::{
    bytes::Bytes,
    inputs::input_owner,
    logging::log,
    tx::{
        tx_script_data_length,
        tx_script_data_start_pointer,
    },
};

abi Prices {
    #[storage(read, write)]
    fn init(signers: Vec<b256>, signer_count_threshold: u64, skip_setting_owner: u64);
}

const SIGNER_COUNT_THRESHOLD = 1;

fn main() {
    let is_local = tx_payload().get(0).unwrap();

    let mut signers: Vec<b256> = Vec::new();
    signers.push(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b);
    signers.push(0x000000000000000000000000109B4a318A4F5ddcbCA6349B45f881B4137deaFB);
    signers.push(0x0000000000000000000000001ea62d73edf8ac05dfcea1a34b9796e937a29eff);
    signers.push(0x0000000000000000000000002c59617248994D12816EE1Fa77CE0a64eEB456BF);
    signers.push(0x00000000000000000000000083cba8c619fb629b81a65c2e67fe15cf3e3c9747);
    signers.push(0x000000000000000000000000f786a909d559f5dee2dc6706d8e5a81728a39ae9); // redstone-rapid-demo
    let prices = abi(Prices, CONTRACT_ID);
    let _ = prices.init(signers, SIGNER_COUNT_THRESHOLD, is_local);
}

fn tx_payload() -> Vec<u64> {
    let input_length = tx_script_data_length();
    let mut bytes = Bytes::with_capacity(input_length);
    bytes.len = input_length;
    tx_script_data_start_pointer().copy_bytes_to(bytes.buf.ptr, input_length);

    let mut result: Vec<u64> = Vec::new();
    let mut i = 0;
    while (i < bytes.len) {
        result.push(bytes.get(i).unwrap());

        i += 1;
    }

    return result;
}
