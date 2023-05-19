library vec;

use std::{u256::U256, vec::*};

pub fn value_index(vec: Vec<U256>, value: U256) -> Option<u64> {
    let mut i = 0;
    while (i < vec.len) {
        if value == vec.get(i).unwrap() {
            return Option::Some(i);
        }

        i += 1;
    }

    return Option::None;
}

pub fn value_index_b256(vec: Vec<b256>, value: b256) -> Option<u64> {
    let mut i = 0;
    while (i < vec.len) {
        if value == vec.get(i).unwrap() {
            return Option::Some(i);
        }

        i += 1;
    }

    return Option::None;
}

pub fn sort(ref mut vec: Vec<U256>) {
    let mut n = vec.len;
    while (n > 1) {
        let mut i = 0;
        while (i < n - 1) {
            if vec.get(i).unwrap() > vec.get(i + 1).unwrap() {
                vec.swap(i, i + 1);
            }

            i += 1;
        }
        n -= 1;
    }
}

fn vec_log(vec: Vec<U256>) {
    let mut i = 0;
    while (i < vec.len) {
        log(vec.get(i).unwrap());
        i += 1;
    }
}
