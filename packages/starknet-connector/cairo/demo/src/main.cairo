use core::array::ArrayTrait;
use demo::test::SAMPLE_BLOCK_TIMESTAMP;
use demo::test::sample_payload_bytes;
use redstone::config::Config;
use redstone::processor::process_payload;

// use demo::debug::ValuesPrint;
// use demo::debug::GenericArrayPrintImpl;

// #[available_gas(2000000)]
fn main() {
    let mut signers: Array<felt252> = Default::default();
    signers.append(0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9);
    signers.append(0x12470f7aba85c8b81d63137dd5925d6ee114952b);
    signers.append(0x109B4a318A4F5ddcbCA6349B45f881B4137deaFB);
    signers.append(0x1ea62d73edf8ac05dfcea1a34b9796e937a29eff);
    signers.append(0x2c59617248994D12816EE1Fa77CE0a64eEB456BF);
    signers.append(0x83cba8c619fb629b81a65c2e67fe15cf3e3c9747);

    let mut feed_ids = ArrayTrait::new();
    feed_ids.append('ETH');
    feed_ids.append('BTC');
    // feed_ids.append('XXX');

    let config = Config {
        block_timestamp: SAMPLE_BLOCK_TIMESTAMP,
        feed_ids: @feed_ids,
        signers: @signers,
        signer_count_threshold: 1_usize
    };

    let payload_bytes = sample_payload_bytes();
    let payload = process_payload(:payload_bytes, :config);

    println!("{}", payload.aggregated_values[0]);

    return ();
}
