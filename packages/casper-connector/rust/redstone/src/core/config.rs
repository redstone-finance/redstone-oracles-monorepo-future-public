use crate::network::specific::{Bytes, U256};

/// Configuration for a RedStone payload processor.
///
/// Specifies the parameters necessary for the verification and aggregation of values
/// from various data points passed by the RedStone payload.
#[derive(Debug)]
pub struct Config {
    /// The minimum number of signers required validating the data.
    ///
    /// Specifies how many unique signers (from different addresses) are required
    /// for the data to be considered valid and trustworthy.
    pub signer_count_threshold: u8,

    /// List of identifiers for signers authorized to sign the data.
    ///
    /// Each signer is identified by a unique, network-specific byte string (`Bytes`),
    /// which represents their address.
    pub signers: Vec<Bytes>,

    /// Identifiers for the data feeds from which values are aggregated.
    ///
    /// Each data feed id is represented by the network-specific `U256` type.
    pub feed_ids: Vec<U256>,

    /// The current block time in timestamp format, used for verifying data timeliness.
    ///
    /// The value's been expressed in milliseconds since the Unix epoch (January 1, 1970) and allows
    /// for determining whether the data is current in the context of blockchain time.
    pub block_timestamp: u64,
}
