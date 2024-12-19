use common::{
    decimals::{AsAsciiStr, ToRedStoneDecimal},
    types::U256Digits,
};
use scrypto::{math::Decimal, prelude::*};

#[derive(ScryptoSbor, Copy, Clone, Debug)]
pub struct PriceDataRaw {
    pub price: U256Digits,
    pub timestamp: u64,
    pub latest_update_timestamp: u64,
}

#[derive(ScryptoSbor)]
pub struct PriceData {
    pub price: Decimal,
    pub timestamp: u64,
    pub latest_update_timestamp: u64,
}

impl ToRedStoneDecimal<PriceData> for PriceDataRaw {
    fn to_redstone_decimal(&self, feed_id: &impl AsAsciiStr) -> PriceData {
        PriceData {
            price: self.price.to_redstone_decimal(feed_id),
            timestamp: self.timestamp,
            latest_update_timestamp: self.latest_update_timestamp,
        }
    }
}
