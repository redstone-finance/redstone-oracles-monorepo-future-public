use crate::{
    network::{
        as_str::{AsAsciiStr, AsHexStr},
        assert::Assert,
        error::Error,
        specific::{FromBytesRepr, U256},
    },
    protocol::constants::DATA_FEED_ID_BS,
    utils::{trim::Trim, trim_zeros::TrimZeros},
};
use std::fmt::{Debug, Formatter};

#[derive(Clone, PartialEq, Eq)]
pub(crate) struct DataPoint {
    pub(crate) feed_id: U256,
    pub(crate) value: U256,
}

pub(crate) fn trim_data_points(
    payload: &mut Vec<u8>,
    count: usize,
    value_size: usize,
) -> Vec<DataPoint> {
    count.assert_or_revert(|&count| count == 1, |&count| Error::SizeNotSupported(count));

    let mut data_points = Vec::new();

    for _ in 0..count {
        let data_point = trim_data_point(payload, value_size);
        data_points.push(data_point);
    }

    data_points
}

fn trim_data_point(payload: &mut Vec<u8>, value_size: usize) -> DataPoint {
    let value = payload.trim_end(value_size);
    let feed_id: Vec<u8> = payload.trim_end(DATA_FEED_ID_BS);

    DataPoint {
        value,
        feed_id: U256::from_bytes_repr(feed_id.trim_zeros()),
    }
}

impl Debug for DataPoint {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "DataPoint {{\n      feed_id: {:?} (0x{}), value: {}\n   }}",
            self.feed_id.as_ascii_str(),
            self.feed_id.as_hex_str(),
            self.value,
        )
    }
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod tests {
    use crate::{
        helpers::hex::hex_to_bytes,
        network::specific::{FromBytesRepr, U256, VALUE_SIZE},
        protocol::{
            constants::DATA_FEED_ID_BS,
            data_point::{trim_data_point, trim_data_points, DataPoint},
        },
    };
    use std::ops::Shr;

    const DATA_POINT_BYTES_TAIL: &str = "4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000360cafc94e";
    const VALUE: u128 = 232141080910;

    #[test]
    fn test_trim_data_points() {
        let mut bytes = hex_to_bytes(DATA_POINT_BYTES_TAIL.into());
        let result = trim_data_points(&mut bytes, 1, 32);

        assert_eq!(result.len(), 1);

        verify_rest_and_result(
            DATA_POINT_BYTES_TAIL,
            32,
            VALUE.into(),
            bytes,
            result[0].clone(),
        )
    }

    #[should_panic(expected = "Size not supported: 0")]
    #[test]
    fn test_trim_zero_data_points() {
        trim_data_points(&mut hex_to_bytes(DATA_POINT_BYTES_TAIL.into()), 0, 32);
    }

    #[should_panic(expected = "Size not supported: 2")]
    #[test]
    fn test_trim_two_data_points() {
        trim_data_points(&mut hex_to_bytes(DATA_POINT_BYTES_TAIL.into()), 2, 32);
    }

    #[test]
    fn test_trim_data_point() {
        test_trim_data_point_of(DATA_POINT_BYTES_TAIL, 32, VALUE.into());
    }

    #[test]
    fn test_trim_data_point_with_prefix() {
        test_trim_data_point_of(
            &("a2a812f3ee1b".to_owned() + DATA_POINT_BYTES_TAIL),
            32,
            VALUE.into(),
        );
    }

    #[test]
    fn test_trim_data_point_other_lengths() {
        for i in 1..VALUE_SIZE {
            test_trim_data_point_of(
                &DATA_POINT_BYTES_TAIL[..DATA_POINT_BYTES_TAIL.len() - 2 * i],
                32 - i,
                U256::from(VALUE).shr(8 * i),
            );
        }
    }

    fn test_trim_data_point_of(value: &str, size: usize, expected_value: U256) {
        let mut bytes = hex_to_bytes(value.into());
        let result = trim_data_point(&mut bytes, size);

        verify_rest_and_result(value, size, expected_value, bytes, result);
    }

    fn verify_rest_and_result(
        value: &str,
        size: usize,
        expected_value: U256,
        rest: Vec<u8>,
        result: DataPoint,
    ) {
        assert_eq!(
            rest,
            hex_to_bytes(value[..value.len() - 2 * (size + DATA_FEED_ID_BS)].into())
        );

        let data_point = DataPoint {
            value: expected_value,
            feed_id: U256::from_bytes_repr(hex_to_bytes(DATA_POINT_BYTES_TAIL[..6].to_string())),
        };

        assert_eq!(result, data_point);
    }
}
