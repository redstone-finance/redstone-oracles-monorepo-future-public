use crate::network::{
    assert::Unwrap,
    error::Error,
    specific::{FromBytesRepr, U256},
};

pub trait Trim<T>
where
    Self: Sized,
{
    fn trim_end(&mut self, len: usize) -> T;
}

impl Trim<Vec<u8>> for Vec<u8> {
    fn trim_end(&mut self, len: usize) -> Self {
        if len >= self.len() {
            std::mem::take(self)
        } else {
            self.split_off(self.len() - len)
        }
    }
}

impl Trim<U256> for Vec<u8> {
    fn trim_end(&mut self, len: usize) -> U256 {
        U256::from_bytes_repr(self.trim_end(len))
    }
}

impl Trim<usize> for Vec<u8> {
    fn trim_end(&mut self, len: usize) -> usize {
        let y: U256 = self.trim_end(len);
        y.try_into().unwrap_or_revert(|_| Error::NumberOverflow(y))
    }
}

impl Trim<u64> for Vec<u8> {
    fn trim_end(&mut self, len: usize) -> u64 {
        let y: U256 = self.trim_end(len);
        y.try_into().unwrap_or_revert(|_| Error::NumberOverflow(y))
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        network::specific::U256,
        protocol::constants::{REDSTONE_MARKER, REDSTONE_MARKER_BS},
        utils::trim::Trim,
    };

    const MARKER_DECIMAL: u64 = 823907890102272;

    fn redstone_marker_bytes() -> Vec<u8> {
        REDSTONE_MARKER.into()
    }

    #[test]
    fn test_trim_end_number() {
        let (rest, result): (_, U256) = test_trim_end(3);
        assert_eq!(result, (256u32.pow(2) * 30).into());
        assert_eq!(rest.as_slice(), &REDSTONE_MARKER[..6]);

        let (_, result): (_, u64) = test_trim_end(3);
        assert_eq!(result, 256u64.pow(2) * 30);

        let (_, result): (_, usize) = test_trim_end(3);
        assert_eq!(result, 256usize.pow(2) * 30);

        let (_, result): (_, Vec<u8>) = test_trim_end(3);
        assert_eq!(result.as_slice(), &REDSTONE_MARKER[6..]);
    }

    #[test]
    fn test_trim_end_number_null() {
        let (rest, result): (_, U256) = test_trim_end(0);
        assert_eq!(result, 0u32.into());
        assert_eq!(rest.as_slice(), &REDSTONE_MARKER);

        let (_, result): (_, u64) = test_trim_end(0);
        assert_eq!(result, 0);

        let (_, result): (_, usize) = test_trim_end(0);
        assert_eq!(result, 0);

        let (_, result): (_, Vec<u8>) = test_trim_end(0);
        assert_eq!(result, Vec::<u8>::new());
    }

    #[test]
    fn test_trim_end_whole() {
        test_trim_end_whole_size(REDSTONE_MARKER_BS);
        test_trim_end_whole_size(REDSTONE_MARKER_BS - 1);
        test_trim_end_whole_size(REDSTONE_MARKER_BS - 2);
        test_trim_end_whole_size(REDSTONE_MARKER_BS + 1);
    }

    fn test_trim_end_whole_size(size: usize) {
        let (rest, result): (_, U256) = test_trim_end(size);
        assert_eq!(result, MARKER_DECIMAL.into());
        assert_eq!(
            rest.as_slice().len(),
            REDSTONE_MARKER_BS - size.min(REDSTONE_MARKER_BS)
        );

        let (_, result): (_, u64) = test_trim_end(size);
        assert_eq!(result, MARKER_DECIMAL);

        let (_, result): (_, usize) = test_trim_end(size);
        assert_eq!(result, 823907890102272usize);

        let (_rest, result): (_, Vec<u8>) = test_trim_end(size);
        assert_eq!(result.as_slice().len(), size.min(REDSTONE_MARKER_BS));
    }

    #[test]
    fn test_trim_end_u64() {
        let mut bytes = vec![255, 255, 255, 255, 255, 255, 255, 255, 255];
        let x: u64 = bytes.trim_end(8);

        let expected_bytes = vec![255];

        assert_eq!(bytes, expected_bytes);
        assert_eq!(x, 18446744073709551615);
    }

    #[should_panic(expected = "Number overflow: 18591708106338011145")]
    #[test]
    fn test_trim_end_u64_overflow() {
        let mut bytes = vec![1u8, 2, 3, 4, 5, 6, 7, 8, 9];

        let _: u64 = bytes.trim_end(9);
    }

    trait TestTrimEnd<T>
    where
        Self: Sized,
    {
        fn test_trim_end(size: usize) -> (Self, T);
    }

    fn test_trim_end<T>(size: usize) -> (Vec<u8>, T)
    where
        Vec<u8>: Trim<T>,
    {
        let mut bytes = redstone_marker_bytes();
        let rest = bytes.trim_end(size);
        (bytes, rest)
    }
}
