use alloc::{
    format,
    string::{String, ToString},
};
use redstone::network::error::ContractErrorContent;

/// Represents errors specific to the price adapter's functionality.
///
/// This enum encapsulates various errors that can occur within the price adapter component
/// of a contract or application.
/// These errors relate to configuration and runtime checks necessary for the correct operation of the price adapter.
///
/// It implements the `ContractErrorContent` trait, allowing these errors to be used directly
/// as part of the RedStone payload processing mechanism.
#[derive(Debug)]
pub(crate) enum PriceAdapterError {
    /// Indicates an invalid value for the signer count threshold.
    ///
    /// This error is returned when the specified threshold for the minimum number of signers
    /// required to validate a price is outside the acceptable range. The contained `u8` value
    /// is the invalid threshold attempted to be set.
    WrongSignerCountThresholdValue(u8),

    /// Signifies that the list of signers provided to the price adapter is empty.
    ///
    /// An empty list of signers is not allowed because the price adapter requires at least one
    /// signer to function correctly. This error is raised during the initialization or configuration
    /// phase if the list of signers is found to be empty.
    SignersMustNotBeEmpty,

    /// Indicates that the provided timestamp is not greater than a previously written timestamp.
    ///
    /// For the price adapter to accept a new price update, the associated timestamp must be
    /// strictly greater than the timestamp of the last update. This error is raised if a new
    /// timestamp does not meet this criterion, ensuring the chronological integrity of price data.
    TimestampMustBeGreaterThanBefore,

    /// Represents a missing value for a specified data feed.
    ///
    /// This error occurs when an expected value for a data feed is not found.
    /// It contains the index (`usize`) identifying the data feed in question and a `String`
    /// message providing additional context or the name of the missing data feed.
    MissingDataFeedValue(usize, String),
}

impl ContractErrorContent for PriceAdapterError {
    #[inline]
    fn code(&self) -> u8 {
        match self {
            PriceAdapterError::WrongSignerCountThresholdValue(_) => 240,
            PriceAdapterError::SignersMustNotBeEmpty => 241,
            PriceAdapterError::TimestampMustBeGreaterThanBefore => 250,
            PriceAdapterError::MissingDataFeedValue(index, _) => 100 + *index as u8,
        }
    }

    #[inline]
    fn message(&self) -> String {
        match self {
            PriceAdapterError::WrongSignerCountThresholdValue(value) => {
                format!("Wrong signer count threshold value: ${}", value)
            }

            PriceAdapterError::SignersMustNotBeEmpty => "Signers must not be empty".to_string(),

            PriceAdapterError::TimestampMustBeGreaterThanBefore => {
                "Timestamp must be greater than before".to_string()
            }

            PriceAdapterError::MissingDataFeedValue(index, feed_id) => {
                format!("Missing data feed value for #{} ({})", index, feed_id)
            }
        }
    }
}
