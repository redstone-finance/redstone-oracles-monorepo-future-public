library;

use std::vec::Vec;
use ::to_vec::*;
use ::timestamp::get_unix_timestamp;

enum RedStoneContractError {
    TimestampMustBeGreaterThanBefore: (u64, u64),
    UpdaterIsNotTrusted: b256,
    MinIntervalBetweenUpdatesHasNotPassedYet: (u64, u64, u64),
}

pub fn check_timestamp(new_timestamp: u64, stored_timestamp: Option<u64>) {
    require(
        new_timestamp > stored_timestamp
            .unwrap_or(0),
        RedStoneContractError::TimestampMustBeGreaterThanBefore((new_timestamp, stored_timestamp.unwrap_or(0))),
    )
}

pub fn check_last_update_block_timestamp(
    last_update_block_timestamp: Option<u64>,
    min_interval_between_updates: u64,
) -> Option<u64> {
    let block_timestamp = get_unix_timestamp();

    if (last_update_block_timestamp.is_none()) {
        return Some(block_timestamp);
    }

    require(
        block_timestamp >= last_update_block_timestamp
            .unwrap() + min_interval_between_updates,
        RedStoneContractError::MinIntervalBetweenUpdatesHasNotPassedYet((
            block_timestamp,
            last_update_block_timestamp.unwrap(),
            min_interval_between_updates,
        )),
    );

    Some(block_timestamp)
}

pub fn check_updater(trusted_updaters: Vec<b256>) {
    let sender = msg_sender().unwrap();

    require(
        trusted_updaters
            .contains(sender.bits()),
        RedStoneContractError::UpdaterIsNotTrusted(sender.bits()),
    );
}
