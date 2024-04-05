use array::ArrayTrait;
use redstone::config::Config;
use redstone::processor::process_payload;
use test::sample_stark::SAMPLE_BLOCK_TIMESTAMP;
use test::sample_stark::sample_payload_bytes;

#[test]
#[available_gas(2000000000)]
fn test_simple_payload() {
    let mut signers: Array<felt252> = Default::default();
    signers.append(0x18f349a975878208678624cc989a5613c76980dc0fd995f5f31498dca168f9d);

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
    assert(*results.aggregated_values[0_usize] == 186824070220, 'Wrong ETH value');
    assert(*results.aggregated_values[1_usize] == 2996858130915, 'Wrong BTC value');
}
