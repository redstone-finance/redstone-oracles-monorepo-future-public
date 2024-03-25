use crate::network::{
    as_str::{AsAsciiStr, AsHexStr},
    specific::U256,
};
use std::fmt::{Debug, Display, Formatter};

pub trait ContractErrorContent: Debug {
    fn code(&self) -> u8;
    fn message(&self) -> String;
}

/// Errors that can be encountered in the deserializing&decrypting the RedStone payload or just contract execution process.
///
/// These errors include issues with contract logic, data types,
/// cryptographic operations, and conditions specific to the requirements.
#[derive(Debug)]
pub enum Error {
    /// Represents errors that arise from the contract itself.
    ///
    /// This variant is used for encapsulating errors that are specific to the contract's logic
    /// or execution conditions that aren't covered by more specific error types.
    ContractError(Box<dyn ContractErrorContent>),

    /// Indicates an overflow error with `U256` numbers.
    ///
    /// Used when operations on `U256` numbers exceed their maximum value, potentially leading
    /// to incorrect calculations or state.
    NumberOverflow(U256),

    /// Used when an expected non-empty array or vector is found to be empty.
    ///
    /// This could occur in scenarios where the contract logic requires a non-empty collection
    /// of items for the correct operation, for example, during aggregating the values.
    ArrayIsEmpty,

    /// Represents errors related to cryptographic operations.
    ///
    /// This includes failures in signature verification, hashing, or other cryptographic
    /// processes, with the usize indicating the position or identifier of the failed operation.
    CryptographicError(usize),

    /// Signifies that an unsupported size was encountered.
    ///
    /// This could be used when a data structure or input does not meet the expected size
    /// requirements for processing.
    SizeNotSupported(usize),

    /// Indicates that the marker bytes for RedStone are incorrect.
    ///
    /// This error is specific to scenarios where marker or identifier bytes do not match
    /// expected values, potentially indicating corrupted or tampered data.
    WrongRedStoneMarker(Vec<u8>),

    /// Used when there is leftover data in a payload that should have been empty.
    ///
    /// This could indicate an error in data parsing or that additional, unexpected data
    /// was included in a message or transaction.
    NonEmptyPayloadRemainder(Vec<u8>),

    /// Indicates that the number of signers does not meet the required threshold.
    ///
    /// This variant includes the current number of signers, the required threshold, and
    /// potentially a feed_id related to the operation that failed due to insufficient signers.
    InsufficientSignerCount(usize, usize, U256),

    /// Used when a timestamp is older than allowed by the processor logic.
    ///
    /// Includes the position or identifier of the timestamp and the threshold value,
    /// indicating that the provided timestamp is too far in the past.
    TimestampTooOld(usize, u64),

    /// Indicates that a timestamp is further in the future than allowed.
    ///
    /// Similar to `TimestampTooOld`, but for future timestamps exceeding the contract's
    /// acceptance window.
    TimestampTooFuture(usize, u64),

    /// Represents errors that need to clone `ContractErrorContent`, which is not supported by default.
    ///
    /// This variant allows for the manual duplication of contract error information, including
    /// an error code and a descriptive message.
    ClonedContractError(u8, String),
}

impl Error {
    pub fn contract_error<T: ContractErrorContent + 'static>(value: T) -> Error {
        Error::ContractError(Box::new(value))
    }

    pub(crate) fn code(&self) -> u16 {
        match self {
            Error::ContractError(boxed) => boxed.code() as u16,
            Error::NumberOverflow(_) => 509,
            Error::ArrayIsEmpty => 510,
            Error::WrongRedStoneMarker(_) => 511,
            Error::NonEmptyPayloadRemainder(_) => 512,
            Error::InsufficientSignerCount(data_package_index, value, _) => {
                (2000 + data_package_index * 10 + value) as u16
            }
            Error::SizeNotSupported(size) => 600 + *size as u16,
            Error::CryptographicError(size) => 700 + *size as u16,
            Error::TimestampTooOld(data_package_index, _) => 1000 + *data_package_index as u16,
            Error::TimestampTooFuture(data_package_index, _) => 1050 + *data_package_index as u16,
            Error::ClonedContractError(code, _) => *code as u16,
        }
    }
}

impl Display for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::ContractError(boxed) => write!(f, "Contract error: {}", boxed.message()),
            Error::NumberOverflow(number) => write!(f, "Number overflow: {}", number),
            Error::ArrayIsEmpty => write!(f, "Array is empty"),
            Error::CryptographicError(size) => write!(f, "Cryptographic Error: {}", size),
            Error::SizeNotSupported(size) => write!(f, "Size not supported: {}", size),
            Error::WrongRedStoneMarker(bytes) => {
                write!(f, "Wrong RedStone marker: {}", bytes.as_hex_str())
            }
            Error::NonEmptyPayloadRemainder(bytes) => {
                write!(f, "Non empty payload remainder: {}", bytes.as_hex_str())
            }
            Error::InsufficientSignerCount(data_package_index, value, feed_id) => write!(
                f,
                "Insufficient signer count {} for #{} ({})",
                value,
                data_package_index,
                feed_id.as_ascii_str()
            ),
            Error::TimestampTooOld(data_package_index, value) => {
                write!(
                    f,
                    "Timestamp {} is too old for #{}",
                    value, data_package_index
                )
            }
            Error::TimestampTooFuture(data_package_index, value) => write!(
                f,
                "Timestamp {} is too future for #{}",
                value, data_package_index
            ),
            Error::ClonedContractError(_, message) => {
                write!(f, "(Cloned) Contract error: {}", message)
            }
        }
    }
}

impl Clone for Error {
    fn clone(&self) -> Self {
        match self {
            Error::ContractError(content) => {
                Error::ClonedContractError(content.code(), content.message())
            }
            Error::NumberOverflow(value) => Error::NumberOverflow(*value),
            Error::ArrayIsEmpty => Error::ArrayIsEmpty,
            Error::CryptographicError(size) => Error::CryptographicError(*size),
            Error::SizeNotSupported(size) => Error::SizeNotSupported(*size),
            Error::WrongRedStoneMarker(bytes) => Error::WrongRedStoneMarker(bytes.clone()),
            Error::NonEmptyPayloadRemainder(bytes) => {
                Error::NonEmptyPayloadRemainder(bytes.clone())
            }
            Error::InsufficientSignerCount(count, needed, bytes) => {
                Error::InsufficientSignerCount(*count, *needed, *bytes)
            }
            Error::TimestampTooOld(index, timestamp) => Error::TimestampTooOld(*index, *timestamp),
            Error::TimestampTooFuture(index, timestamp) => {
                Error::TimestampTooFuture(*index, *timestamp)
            }
            Error::ClonedContractError(code, message) => {
                Error::ClonedContractError(*code, message.as_str().into())
            }
        }
    }
}
