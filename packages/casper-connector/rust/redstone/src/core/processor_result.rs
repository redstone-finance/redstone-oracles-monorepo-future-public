use crate::network::specific::U256;

/// Represents the result of processing the RedStone payload.
///
/// This structure is used to encapsulate the outcome of a RedStone payload processing operation,
/// particularly focusing on time-sensitive data and its associated values, according to the `Config`.
#[derive(Debug, Eq, PartialEq)]
pub struct ProcessorResult {
    /// The minimum timestamp encountered during processing.
    ///
    /// This field captures the earliest time point (in milliseconds since the Unix epoch)
    /// among the processed data packages, indicating the starting boundary of the dataset's time range.
    pub min_timestamp: u64,

    /// A collection of values processed during the operation.
    ///
    /// Each element in this vector represents a processed value corresponding
    /// to the passed data_feed item in the `Config`.
    pub values: Vec<U256>,
}

impl From<ProcessorResult> for (u64, Vec<U256>) {
    fn from(result: ProcessorResult) -> Self {
        (result.min_timestamp, result.values)
    }
}
