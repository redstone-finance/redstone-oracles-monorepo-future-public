use crate::network::error::Error;
use casper_types::ApiError;

impl From<Error> for ApiError {
    fn from(error: Error) -> Self {
        ApiError::User(error.code())
    }
}
