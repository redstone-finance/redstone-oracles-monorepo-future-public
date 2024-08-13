#[cfg(test)]
mod tests {
    use casper_types::bytesrepr::Bytes;
    use itertools::Itertools;
    use rand::{seq::SliceRandom, thread_rng};

    use redstone::network::{as_str::AsHexStr, flattened::Flattened};
    use redstone_casper::contracts::run_mode::{
        RunMode,
        RunMode::{Get, Write},
    };

    use crate::core::{
        run_env::RunEnv,
        utils::{hash_message, split},
    };

    fn make_payload_data() -> (Bytes, Vec<Bytes>) {
        let payload: Bytes = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].into();
        let hash = hash_message(&payload);
        let chunks = split(payload, 3);
        (hash, chunks)
    }

    #[should_panic(expected = "User error: 511")] //the error means the payload started to be processed in the adapter
    #[test]
    fn test_write_payload_chunks() {
        let (hash, chunks) = make_payload_data();
        let mut iterator: Vec<_> = chunks.iter().enumerate().collect();
        iterator.shuffle(&mut thread_rng());

        test_save_payload_chunks(
            &mut RunEnv::prepare(),
            Write,
            &hash,
            &chunks,
            iterator.iter(),
        );
    }

    #[should_panic(expected = "User error: 511")] //the error means the payload started to be processed in the adapter
    #[test]
    fn test_get_payload_chunks() {
        let (hash, chunks) = make_payload_data();
        let mut iterator: Vec<_> = chunks.iter().enumerate().collect();
        iterator.shuffle(&mut thread_rng());

        test_save_payload_chunks(&mut RunEnv::prepare(), Get, &hash, &chunks, iterator.iter());
    }

    #[test]
    fn test_save_some_payload_chunks() {
        let (hash, chunks) = make_payload_data();

        for m in 0..chunks.len() {
            for n in (m + 1)..chunks.len() - 1 {
                let iterator = chunks[m..n].iter().enumerate();
                let perms = iterator.permutations(n - m);

                for perm in perms {
                    test_save_payload_chunks(
                        &mut RunEnv::prepare(),
                        Write,
                        &hash,
                        &chunks[m..n].into(),
                        perm.iter(),
                    );
                }
            }
        }
    }

    #[test]
    fn test_save_some_payload_chunks_overwrite() {
        let mut rng = thread_rng();
        let mut env = RunEnv::prepare();
        let (hash, chunks) = make_payload_data();
        let mut iterator: Vec<_> = chunks[1..].iter().enumerate().collect();

        for &mode in vec![Write, Get, Get, Write].iter() {
            iterator.shuffle(&mut rng);
            test_save_payload_chunks(&mut env, mode, &hash, &chunks[1..].into(), iterator.iter());
        }
    }

    fn test_save_payload_chunks<'a, I: Iterator<Item = &'a (usize, &'a Bytes)>>(
        env: &mut RunEnv,
        mode: RunMode,
        hash: &Bytes,
        chunks: &Vec<Bytes>,
        iterator: I,
    ) {
        let adapter_key = env.install_default_price_adapter();
        let _ = env.install_price_relay_adapter(adapter_key);

        env.iterate_chunks(
            mode,
            iterator.map(|&(index, bytes)| (index, bytes)),
            vec![],
            hash,
            0,
        );

        let saved_chunks: Vec<Bytes> = env.unpack(env.query_contract_dic(
            RunEnv::PRICE_RELAY_ADAPTER_KEY,
            "payloads",
            &hash.as_hex_str(),
        ));

        assert_eq!(saved_chunks.flattened(), chunks.flattened());
    }
}
