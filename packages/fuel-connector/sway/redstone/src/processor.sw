library processor;

dep protocol;
dep config;
dep config_validation;
dep aggregation;
dep sample;

use std::{bytes::*, logging::log, option::*, u256::U256, vec::*};

use protocol::Payload;
use config::Config;
use config_validation::*;
use aggregation::aggregate_results;
use sample::{SAMPLE_SIGNER_ADDRESS_0, SAMPLE_SIGNER_ADDRESS_1, SamplePayload};

enum Entry {
    Value: U256,
    Empty: (),
}

pub fn process_input(bytes: Bytes, config: Config) -> (Vec<U256>, u64) {
    let payload = Payload::from_bytes(bytes);
    config.validate_timestamps(payload);

    let matrix = get_payload_result_matrix(payload, config);
    let results = get_feed_values(matrix, config);

    config.validate_signer_count(results);

    let aggregated = aggregate_results(results);
    let timestamp = payload.data_packages.get(0).unwrap().timestamp;

    return (aggregated, timestamp);
}

fn get_feed_values(matrix: Vec<Entry>, config: Config) -> Vec<Vec<U256>> {
    let mut results = Vec::new();

    let mut f = 0;
    while (f < config.feed_ids.len) {
        let mut s = 0;
        let mut values = Vec::new();
        while (s < config.signers.len) {
            let index = config.index(f, s);
            match matrix.get(index).unwrap() {
                Entry::Value(value) => {
                    values.push(value);
                },
                Entry::Empty => (),
            }
            s += 1;
        }
        results.push(values);
        f += 1;
    }

    return results;
}

fn get_payload_result_matrix(payload: Payload, config: Config) -> Vec<Entry> {
    let mut i = 0;
    let mut j = 0;
    let mut results = Vec::new();

    while (i < config.cap()) {
        results.push(Entry::Empty);
        i += 1;
    }

    i = 0;
    while (i < payload.data_packages.len) {
        let data_package = payload.data_packages.get(i).unwrap();
        let s = config.validate_signer(data_package, i);

        if (s.is_none()) {
            i += 1;
            continue;
        }

        j = 0;
        while (j < data_package.data_points.len) {
            let data_point = data_package.data_points.get(j).unwrap();
            let f = config.feed_id_index(data_point.feed_id);
            if f.is_none() {
                j += 1;
                continue;
            }

            let index = config.index(f.unwrap(), s.unwrap());
            results.set(index, Entry::Value(data_point.value));
            j += 1;
        }

        i += 1;
    }

    return results;
}

#[test]
fn test_process_input_payload_2BTC_2ETH() {
    let payload = SamplePayload::eth_btc_2x2();
    let config = make_config(1678113540 + 60, 2, Option::Some(BTC), true);

    let (results, timestamp) = process_input(payload.bytes(), config);

    assert(results.get(0).unwrap().d == 156962499984);
    assert(results.get(1).unwrap().d == 2242266554738);
    assert(timestamp == 1678113540000);
}

#[test]
fn test_process_input_payload_2BTC_2ETH_but_BTC_not_needed() {
    let payload = SamplePayload::eth_btc_2x2();
    let config = make_config(1678113540 + 60, 2, Option::None, true);

    let (results, _) = process_input(payload.bytes(), config);

    assert(results.get(0).unwrap().d == 156962499984);
    assert(results.get(1).is_none());
}

#[test(should_revert)]
fn test_process_input_should_revert_for_payload_2BTC_2ETH_but_missing_AVAX() {
    let payload = SamplePayload::eth_btc_2x2();
    let config = make_config(1678113540 + 60, 2, Option::Some(AVAX), true);

    process_input(payload.bytes(), config);
}

#[test]
fn test_process_input_payload_1BTC_2ETH_1signer_required() {
    let payload = SamplePayload::eth_btc_2plus1();
    let config = make_config(1678113540 + 60, 1, Option::Some(BTC), true);

    let (results, _) = process_input(payload.bytes(), config);

    assert(results.get(0).unwrap().d == 156962499984);
    assert(results.get(1).unwrap().d == 0x20a10566cd6);
}

#[test(should_revert)]
fn test_process_input_should_revert_for_payload_1BTC_2ETH_2signers_required() {
    let payload = SamplePayload::eth_btc_2plus1();
    let config = make_config(1678113540 + 60, 2, Option::Some(BTC), true);

    process_input(payload.bytes(), config);
}

#[test]
fn test_process_input_payload_1BTC_2ETH_1signer_allowed() {
    let payload = SamplePayload::eth_btc_2plus1();
    let config = make_config(1678113540 + 60, 1, Option::Some(BTC), false);

    let (results, _) = process_input(payload.bytes(), config);

    assert(results.get(0).unwrap().d == 0x248b314244);
    assert(results.get(1).unwrap().d == 0x20a10566cd6);
}

#[test]
fn test_process_input_payload_2BTC_2ETH_1signer_allowed() {
    let payload = SamplePayload::eth_btc_2x2();
    let config = make_config(1678113540 + 60, 1, Option::Some(BTC), false);

    let (results, _) = process_input(payload.bytes(), config);

    assert(results.get(0).unwrap().d == 0x248b314244);
    assert(results.get(1).unwrap().d == 0x20a10566cd6);
}

#[test(should_revert)]
fn test_process_input_should_revert_for_payload_with_too_big_timestamp_span() {
    let payload = SamplePayload::big_timestamp_span();
    let config = make_config(1677588880, 1, Option::None, false);

    process_input(payload.bytes(), config);
}

const AVAX = U256::from((0, 0, 0, 0x41564158));
const BTC = U256::from((0, 0, 0, 0x425443));
const ETH = U256::from((0, 0, 0, 0x455448));

fn make_config(
    block_timestamp: u64,
    signer_count_threshold: u64,
    additional_feed_id: Option<U256>,
    with_second_signer: bool,
) -> Config {
    let mut feed_ids = Vec::new();
    feed_ids.push(ETH);
    if (!additional_feed_id.is_none()) {
        feed_ids.push(additional_feed_id.unwrap());
    }

    let mut signers = Vec::new();
    signers.push(SAMPLE_SIGNER_ADDRESS_0);
    if (with_second_signer) {
        signers.push(SAMPLE_SIGNER_ADDRESS_1);
    }

    return Config {
        feed_ids: feed_ids,
        signers: signers,
        signer_count_threshold,
        block_timestamp,
    };
}
