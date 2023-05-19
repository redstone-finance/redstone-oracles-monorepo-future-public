library bytes;

dep numbers;
dep from_bytes;

use std::{b256::*, bytes::*, math::*, u256::U256};
use numbers::*;
use from_bytes::FromBytes;

impl Bytes {
    pub fn slice_tail_offset(self, tail_size: u64, tail_offset: u64) -> (Bytes, Bytes) {
        let (head, mut tail) = self.split_at(self.len - tail_size - tail_offset);
        tail.len = tail_size;

        return (head, tail);
    }
}

impl Bytes {
    pub fn slice_tail(self, tail_size: u64) -> (Bytes, Bytes) {
        return self.slice_tail_offset(tail_size, 0);
    }
}

impl Bytes {
    pub fn slice_number_offset(self, tail_size: u64, tail_offset: u64) -> (Bytes, u64) {
        let (head, tail) = self.slice_tail_offset(tail_size, tail_offset);

        return (head, u64::from_bytes(tail));
    }
}

impl Bytes {
    pub fn slice_number(self, tail_size: u64) -> (Bytes, u64) {
        return self.slice_number_offset(tail_size, 0);
    }

    pub fn join(self, other: Bytes) -> Bytes {
        let mut result = self;
        result.append(other);

        return result;
    }

    fn truncated(self) -> Bytes {
        let mut n = self.len - 1;
        let mut result = self;
        while (n > 0) {
            if (self.get(n).unwrap() == 0) {
                n -= 1;
                continue;
            }

            break;
        }

        result.len = n + 1;

        return result;
    }
}

impl FromBytes for U256 {
    fn from_bytes(bytes: Bytes) -> U256 {
        let mut parts = Vec::new();

        let mut n = bytes.len;
        let mut o = 0;
        while (n > 0) {
            let mut m = 8;
            if (n < 8) {
                m = n;
            }
            let (rest, num) = bytes.slice_number_offset(m, o);
            parts.push(num);

            n -= m;
            o += m;
        }

        return U256 {
            a: parts.get(3).unwrap_or(0),
            b: parts.get(2).unwrap_or(0),
            c: parts.get(1).unwrap_or(0),
            d: parts.get(0).unwrap_or(0),
        }
    }
}

impl U256 {
    pub fn from_bytes_truncated(bytes: Bytes) -> U256 {
        return U256::from_bytes(bytes.truncated());
    }
}
