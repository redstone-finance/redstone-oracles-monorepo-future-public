use scrypto::prelude::*;

pub fn get_current_time() -> u64 {
    let rtn = ScryptoVmV1Api::object_call(
        CONSENSUS_MANAGER.as_node_id(),
        CONSENSUS_MANAGER_GET_CURRENT_TIME_IDENT,
        scrypto_encode(&ConsensusManagerGetCurrentTimeInputV2 {
            precision: TimePrecisionV2::Second,
        })
        .unwrap(),
    );

    let instant: Instant = scrypto_decode(&rtn).unwrap();

    instant.seconds_since_unix_epoch as u64
}
