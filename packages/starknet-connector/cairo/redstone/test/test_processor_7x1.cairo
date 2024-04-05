use array::ArrayTrait;
use redstone::config::Config;
use redstone::processor::process_payload;
use test::sample_7x1::SAMPLE_BLOCK_TIMESTAMP;
use test::sample_7x1::sample_payload_bytes;

#[test]
#[available_gas(2000000000)]
fn test_simple_payload() {
    let mut signers: Array<felt252> = Default::default();

    let mut feed_ids = Default::default();
    feed_ids.append('ETH');
    feed_ids.append('BTC');
    // feed_ids.append('XXX');

    let config = Config {
        block_timestamp: SAMPLE_BLOCK_TIMESTAMP,
        feed_ids: @feed_ids,
        signers: @signers,
        signer_count_threshold: 1_usize
    };

    let results = process_payload(sample_payload_bytes(), :config);
    assert(*results.aggregated_values[0_usize] == 185522320246, 'Wrong ETH value');
    assert(*results.aggregated_values[1_usize] == 2791053026156, 'Wrong BTC value');
}
