library;

use std::vec::Vec;
use ::to_vec::*;

enum RedStoneContractError {
    TimestampMustBeGreaterThanBefore: (u64, u64),
    UpdaterIsNotTrusted: b256,
}

pub fn check_timestamp(new_timestamp: u64, stored_timestamp: Option<u64>) {
    require(
        new_timestamp > stored_timestamp
            .unwrap_or(0),
        RedStoneContractError::TimestampMustBeGreaterThanBefore((new_timestamp, stored_timestamp.unwrap_or(0))),
    )
}

pub fn check_updater(trusted_updaters: Vec<b256>) {
    let sender = msg_sender().unwrap();

    require(
        trusted_updaters
            .contains(sender.bits()),
        RedStoneContractError::UpdaterIsNotTrusted(sender.bits()),
    );
}
