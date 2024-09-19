script;

use std::logging::log;

configurable {
    CONTRACT_ID: b256 = 0x92964ec694dee751d40ed6e2414b553a2cddd90d39607a71d46d97ae8b264a36,
}

abi Prices {
    #[storage(read, write)]
    fn init(signers: Vec<b256>, signer_count_threshold: u64);
}

const SIGNER_COUNT_THRESHOLD = 1;

fn main() {
    let mut signers: Vec<b256> = Vec::new();
    signers.push(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b);
    signers.push(0x000000000000000000000000109B4a318A4F5ddcbCA6349B45f881B4137deaFB);
    signers.push(0x0000000000000000000000001ea62d73edf8ac05dfcea1a34b9796e937a29eff);
    signers.push(0x0000000000000000000000002c59617248994D12816EE1Fa77CE0a64eEB456BF);
    signers.push(0x00000000000000000000000083cba8c619fb629b81a65c2e67fe15cf3e3c9747);
    signers.push(0x000000000000000000000000f786a909d559f5dee2dc6706d8e5a81728a39ae9); // redstone-rapid-demo
    let prices = abi(Prices, CONTRACT_ID);
    let _ = prices.init(signers, SIGNER_COUNT_THRESHOLD);
}
