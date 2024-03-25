use blake2b_ref::Blake2bBuilder;
use casper_types::bytesrepr::Bytes;
use std::time::UNIX_EPOCH;

pub(crate) fn split(bytes: Bytes, chunk_size: usize) -> Vec<Bytes> {
    bytes.chunks(chunk_size).map(|chunk| chunk.into()).collect()
}

pub(crate) fn get_system_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time not fetched")
        .as_secs()
}

pub(crate) fn hash_message(msg: &Bytes) -> Bytes {
    hash(msg.as_slice()).as_slice().into()
}

fn hash(msg: &[u8]) -> [u8; 32] {
    let mut output = [0u8; 32];
    let mut blake2b = Blake2bBuilder::new(32).build();
    blake2b.update(msg);
    blake2b.finalize(&mut output);

    output
}
