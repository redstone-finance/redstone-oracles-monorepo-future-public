library aggregation;

dep utils/vec;
dep utils/numbers;

use std::{u256::U256, vec::*};
use vec::sort;
use numbers::*;

pub fn aggregate_results(results: Vec<Vec<U256>>) -> Vec<U256> {
    let mut aggregated = Vec::new();

    let mut i = 0;
    while (i < results.len) {
        let values = results.get(i).unwrap();
        aggregated.push(aggregate_values(values));

        i += 1;
    }

    return aggregated;
}

fn aggregate_values(values: Vec<U256>) -> U256 {
    let mut values = values;
    sort(values);
    let mut j = 0;
    while (j < values.len) {
        j += 1;
    }

    let mid = values.len / 2;

    if (values.len - 2 * mid == 1) {
        return values.get(mid).unwrap();
    }

    return (values.get(mid).unwrap() + values.get(mid - 1).unwrap()).rsh(1);
}

#[test]
fn test_aggregate_single_value() {
    let mut data = Vec::new();
    data.push(U256::from_u64(333));

    let aggregated = aggregate_values(data);
    assert(aggregated == U256::from_u64(333));
}

#[test]
fn test_aggregate_two_values() {
    let mut data = Vec::new();
    data.push(U256::from_u64(333));
    data.push(U256::from_u64(222));

    let aggregated = aggregate_values(data);
    assert(aggregated == U256::from_u64(277));
}

#[test]
fn test_aggregate_three_values() {
    let mut data = Vec::new();

    data.push(U256::from_u64(444));
    data.push(U256::from_u64(222));
    data.push(U256::from_u64(333));

    let aggregated = aggregate_values(data);
    assert(aggregated == U256::from_u64(333));
}

#[test]
fn test_aggregate_four_values() {
    let mut data = Vec::new();

    data.push(U256::from_u64(444));
    data.push(U256::from_u64(222));
    data.push(U256::from_u64(111));
    data.push(U256::from_u64(555));

    let aggregated = aggregate_values(data);
    assert(aggregated == U256::from_u64(333));
}

#[test]
fn test_aggregate_five_values() {
    let mut data = Vec::new();

    data.push(U256::from_u64(444));
    data.push(U256::from_u64(222));
    data.push(U256::from_u64(111));
    data.push(U256::from_u64(333));
    data.push(U256::from_u64(555));

    let aggregated = aggregate_values(data);
    assert(aggregated == U256::from_u64(333));
}

#[test]
fn test_aggregate_three_other_values() {
    let mut data = Vec::new();

    data.push(U256::from_u64(222));
    data.push(U256::from_u64(222));
    data.push(U256::from_u64(333));

    let aggregated = aggregate_values(data);
    assert(aggregated == U256::from_u64(222));
}

#[test(should_revert)]
fn test_aggregate_zero_values() {
    let data = Vec::new();
    aggregate_values(data);
}
