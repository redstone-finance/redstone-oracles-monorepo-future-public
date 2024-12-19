use crate::types::U256Digits;
use scrypto::prelude::U256;

pub trait IntoT<T> {
    fn into_t(self) -> T;
}

impl IntoT<Vec<U256>> for Vec<U256Digits> {
    fn into_t(self) -> Vec<U256> {
        self.iter().map(|&d| U256::from_digits(d)).collect()
    }
}
