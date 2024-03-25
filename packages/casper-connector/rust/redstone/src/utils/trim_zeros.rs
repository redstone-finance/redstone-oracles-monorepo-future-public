pub trait TrimZeros {
    fn trim_zeros(self) -> Self;
}

impl TrimZeros for Vec<u8> {
    fn trim_zeros(self) -> Self {
        let mut res = self.len();

        for i in (0..self.len()).rev() {
            if self[i] != 0 {
                break;
            }

            res = i;
        }

        let (rest, _) = self.split_at(res);

        rest.into()
    }
}

#[cfg(test)]
mod tests {
    use crate::{protocol::constants::REDSTONE_MARKER, utils::trim_zeros::TrimZeros};

    fn redstone_marker_bytes() -> Vec<u8> {
        REDSTONE_MARKER.as_slice().into()
    }

    #[test]
    fn test_trim_zeros() {
        let trimmed = redstone_marker_bytes().trim_zeros();
        assert_eq!(trimmed.as_slice(), &REDSTONE_MARKER[..7]);

        let trimmed = trimmed.trim_zeros();
        assert_eq!(trimmed.as_slice(), &REDSTONE_MARKER[..7]);
    }

    #[test]
    fn test_trim_zeros_empty() {
        let trimmed = Vec::<u8>::default().trim_zeros();
        assert_eq!(trimmed, Vec::<u8>::default());
    }
}
