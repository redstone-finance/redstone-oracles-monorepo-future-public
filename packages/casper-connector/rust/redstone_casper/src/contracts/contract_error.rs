use casper_types::ApiError;

/// Represents errors that may occur within the contract execution.
///
/// This enumeration lists various error conditions
/// that are specific to the contract's logic or data handling processes.
/// Each variant is associated with a unique `u16` code to facilitate easy identification
/// and matching within contract logic and external diagnostics.
#[repr(u16)]
pub enum ContractError {
    /// Error indicating that an attempt was made
    /// to create a key that already exists within the contract's storage.
    ///
    /// This error is returned when a new entry cannot be created because its key is already in use,
    /// suggesting a potential duplication or overlap in data management or initialization logic.
    KeyAlreadyExists = 10,

    /// Error indicating a mismatch between expected and actual keys.
    ///
    /// This occurs when the key being accessed does not match the expected format or value,
    /// potentially indicating an error in key generation or retrieval logic.
    KeyMismatch = 11,

    /// Error indicating that a retrieved value does not match the criteria of contract or package hash.
    WrongHash = 15,

    /// Error indicating that an attempt was made to write an index outside the allowable range.
    IndexRangeExceeded = 16,
}

impl From<ContractError> for ApiError {
    #[inline]
    fn from(error: ContractError) -> Self {
        ApiError::User(error as u16)
    }
}
