use interface::round_data::RoundData;
use utils::u64tuple_convertible::U64TupleConvertible;

pub impl RoundDataU64TupleConvertible of U64TupleConvertible<RoundData> {
    fn from_u64_tuple(a: u64, b: u64, c: u64, d: u64) -> RoundData {
        RoundData { round_number: a, payload_timestamp: b, block_number: c, block_timestamp: d }
    }
    fn to_u64_tuple(self: RoundData) -> (u64, u64, u64, u64,) {
        (self.round_number, self.payload_timestamp, self.block_number, self.block_timestamp)
    }
}
