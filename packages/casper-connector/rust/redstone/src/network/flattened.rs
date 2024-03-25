use crate::network::specific::Bytes;

pub trait Flattened<T> {
    fn flattened(&self) -> T;
}

impl Flattened<Bytes> for Vec<Bytes> {
    fn flattened(&self) -> Bytes {
        #[allow(clippy::useless_conversion)]
        self.iter().flatten().copied().collect::<Vec<_>>().into()
    }
}

#[cfg(test)]
mod tests {
    use crate::network::{flattened::Flattened, specific::Bytes};

    #[test]
    fn test_bytes_flattened() {
        #[allow(clippy::useless_conversion)]
        let bytes: Vec<Bytes> = vec![
            vec![1u8, 2, 3].into(),
            vec![4u8].into(),
            vec![].into(),
            vec![5, 6, 7].into(),
        ];

        let result: Bytes = bytes.flattened();

        #[allow(clippy::useless_conversion)]
        let expected_result: Bytes = vec![1u8, 2, 3, 4, 5, 6, 7].into();

        assert_eq!(result, expected_result);
    }
}
