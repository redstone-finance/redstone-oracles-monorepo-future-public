use crate::{
    network::{error::Error, specific::revert},
    print_debug,
};
use std::fmt::Debug;

pub trait Assert<F> {
    fn assert_or_revert<E: Fn(&Self) -> Error>(self, check: F, error: E) -> Self;
}

impl<T, F> Assert<F> for T
where
    T: Debug,
    F: Fn(&Self) -> bool,
{
    fn assert_or_revert<E: FnOnce(&Self) -> Error>(self, check: F, error: E) -> Self {
        assert_or_revert(self, check, error)
    }
}

#[inline]
fn assert_or_revert<F, T, E: FnOnce(&T) -> Error>(arg: T, check: F, error: E) -> T
where
    F: Fn(&T) -> bool,
    T: Debug,
{
    assert_or_revert_bool_with(check(&arg), || error(&arg));

    arg
}

#[inline]
fn assert_or_revert_bool_with<E: FnOnce() -> Error>(check: bool, error: E) {
    if check {
        return;
    }

    let error = error();
    print_debug!("REVERT({}) - {}!", &error.code(), error);
    revert(error);
}

pub trait Unwrap<R> {
    type ErrorArg;

    fn unwrap_or_revert<E: Fn(&Self::ErrorArg) -> Error>(self, error: E) -> R;
}

impl<T> Unwrap<T> for Option<T>
where
    T: Debug,
{
    type ErrorArg = ();

    fn unwrap_or_revert<E: Fn(&Self::ErrorArg) -> Error>(self, error: E) -> T {
        assert_or_revert(self, |arg| arg.is_some(), |_| error(&())).unwrap()
    }
}

impl<T, Err> Unwrap<T> for Result<T, Err>
where
    T: Debug,
    Err: Debug,
{
    type ErrorArg = Err;

    fn unwrap_or_revert<E: Fn(&Self::ErrorArg) -> Error>(self, error: E) -> T {
        assert_or_revert(
            self,
            |arg| arg.is_ok(),
            |e| error(e.as_ref().err().unwrap()),
        )
        .unwrap()
    }
}

#[cfg(test)]
mod assert_or_revert_tests {
    use crate::network::{
        assert::{assert_or_revert_bool_with, Assert},
        error::Error,
    };

    #[test]
    fn test_assert_or_revert_bool_with_true() {
        assert_or_revert_bool_with(true, || Error::ArrayIsEmpty);
    }

    #[should_panic(expected = "Array is empty")]
    #[test]
    fn test_assert_or_revert_bool_with_false() {
        assert_or_revert_bool_with(false, || Error::ArrayIsEmpty);
    }

    #[test]
    fn test_assert_or_revert_correct() {
        5.assert_or_revert(|&x| x == 5, |&size| Error::SizeNotSupported(size));
    }

    #[should_panic(expected = "Size not supported: 5")]
    #[test]
    fn test_assert_or_revert_wrong() {
        5.assert_or_revert(|&x| x < 5, |&size| Error::SizeNotSupported(size));
    }
}

#[cfg(test)]
mod unwrap_or_revert_tests {
    use crate::network::{assert::Unwrap, error::Error};

    #[test]
    fn test_unwrap_or_revert_some() {
        let result = Some(543).unwrap_or_revert(|_| Error::CryptographicError(333));

        assert_eq!(result, 543);
    }

    #[should_panic(expected = "Cryptographic Error: 333")]
    #[test]
    fn test_unwrap_or_revert_none() {
        (Option::<u64>::None).unwrap_or_revert(|_| Error::CryptographicError(333));
    }

    #[test]
    fn test_unwrap_or_revert_ok() {
        let result = Ok(256).unwrap_or_revert(|_: &Error| Error::CryptographicError(333));

        assert_eq!(result, 256);
    }

    #[should_panic(expected = "Cryptographic Error: 567")]
    #[test]
    fn test_unwrap_or_revert_err() {
        Result::<&[u8], Error>::Err(Error::CryptographicError(567)).unwrap_or_revert(|e| e.clone());
    }
}
