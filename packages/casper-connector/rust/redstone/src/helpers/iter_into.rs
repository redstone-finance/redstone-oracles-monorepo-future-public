pub trait IterInto<U> {
    fn iter_into(&self) -> U;
}

impl<U, T: Copy + Into<U>> IterInto<Vec<U>> for Vec<T> {
    fn iter_into(&self) -> Vec<U> {
        self.iter().map(|&value| value.into()).collect()
    }
}

pub trait OptIterIntoOpt<U> {
    fn opt_iter_into_opt(&self) -> U;
}

impl<U, T: Copy + Into<U>> OptIterIntoOpt<Vec<Option<U>>> for Vec<Option<T>> {
    fn opt_iter_into_opt(&self) -> Vec<Option<U>> {
        self.iter().map(|&value| value.map(|v| v.into())).collect()
    }
}

pub trait IterIntoOpt<U> {
    fn iter_into_opt(&self) -> U;
}

impl<U: Copy, T: Copy + Into<U>> IterIntoOpt<Vec<Option<U>>> for Vec<T> {
    fn iter_into_opt(&self) -> Vec<Option<U>> {
        self.iter_into().iter_into()
    }
}

#[cfg(test)]
mod iter_into_tests {
    use crate::{
        helpers::iter_into::{IterInto, IterIntoOpt, OptIterIntoOpt},
        network::specific::U256,
    };

    #[test]
    fn test_iter_into() {
        let values = vec![23u128, 12, 12, 23];

        assert_eq!(
            values.iter_into() as Vec<U256>,
            vec![23u8.into(), 12u8.into(), 12u8.into(), 23u8.into()]
        )
    }

    #[test]
    fn test_iter_into_opt() {
        let values: Vec<u8> = vec![23u8, 12, 12, 23];

        assert_eq!(
            values.iter_into_opt(),
            vec![Some(23u8), 12u8.into(), 12u8.into(), 23u8.into()]
        )
    }

    #[test]
    fn test_opt_iter_into_opt() {
        let values: Vec<Option<u128>> =
            vec![Some(23u128), 12.into(), 12.into(), None, 23.into(), None];

        assert_eq!(
            values.opt_iter_into_opt() as Vec<Option<U256>>,
            vec![
                Some(U256::from(23u8)),
                U256::from(12u8).into(),
                U256::from(12u8).into(),
                None,
                U256::from(23u8).into(),
                None
            ]
        )
    }
}
