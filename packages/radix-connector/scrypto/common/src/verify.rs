use crate::{
    price_adapter_error::PriceAdapterError,
    types::{process_signers, Signers},
};
use redstone::network::{assert::Assert, error::Error};

pub fn verify_timestamps(
    current_timestamp: u64,
    data_timestamp: u64,
    latest_update_timestamp: Option<u64>,
    latest_data_timestamp: u64,
) {
    data_timestamp.assert_or_revert(
        |&ts| ts > latest_data_timestamp,
        |_| Error::contract_error(PriceAdapterError::TimestampMustBeGreaterThanBefore),
    );

    current_timestamp.assert_or_revert(
        |&ts| latest_update_timestamp.is_none() || ts > latest_update_timestamp.unwrap(),
        |_| {
            Error::contract_error(
                PriceAdapterError::CurrentTimestampMustBeGreaterThanLatestUpdateTimestamp,
            )
        },
    );
}

pub fn verify_signers(
    signer_count_threshold: u8,
    allowed_signer_addresses: Signers,
) -> Vec<Vec<u8>> {
    // TODO: make check signers are unique

    let signers = process_signers(allowed_signer_addresses);

    signers.len().assert_or_revert(
        |&v| v > 0usize,
        |_| Error::contract_error(PriceAdapterError::SignersMustNotBeEmpty),
    );

    signer_count_threshold.assert_or_revert(
        |&v| (v as usize) <= signers.len(),
        |&v| Error::contract_error(PriceAdapterError::WrongSignerCountThresholdValue(v)),
    );

    signers
}
