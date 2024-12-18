module redstone_price_adapter::redstone_sdk_crypto;

const E_INVALID_SIGNATURE: u64 = 0;
const E_INVALID_RECOVERY_ID: u64 = 1;

/// `recover_address` doesn't check the signature validity, it just recovers the address.
/// the signatures are validated at a later step by checking if the
/// recovered signers are present in the configured signers array and meets
/// the minimum signers threshold
///
/// the function might abort with invalid signature error if address recovery fails
public fun recover_address(msg: &vector<u8>, signature: &vector<u8>): vector<u8> {
    assert!(vector::length(signature) == 65, E_INVALID_SIGNATURE);

    // Create a mutable copy of the signature
    let mut sig = *signature;

    // Extract the 'v' value and ensure it's in the range {0, 1, 2, 3}
    let v = *vector::borrow(&sig, 64);
    let v = if (v >= 27) {
        v - 27
    } else {
        v
    };
    assert!(v <4, E_INVALID_RECOVERY_ID);

    // Replace the last byte of the signature with the adjusted recovery byte
    *vector::borrow_mut(&mut sig, 64) = v;

    let keccak_hash_function_type = 0;
    let compressed_public_key = sui::ecdsa_k1::secp256k1_ecrecover(
        &sig,
        msg,
        keccak_hash_function_type,
    );
    let public_key = sui::ecdsa_k1::decompress_pubkey(&compressed_public_key);

    let key_hash = sui::hash::keccak256(&last_n_bytes(
        &public_key, 
        vector::length(&public_key) - 1),
    );

    let recovered_address = last_n_bytes(&key_hash, 20);

    recovered_address
}


fun last_n_bytes(input: &vector<u8>, n: u64): vector<u8> {
    let mut result = vector::empty<u8>();
    let len = vector::length(input);

    assert!(n <= len, 123);
    let mut i = len - n;

    while (i < len) {
        vector::push_back(
            &mut result,
            *vector::borrow(input, i),
        );
        i = i + 1;
    };

    result
}

#[test_only]
const E_SIGNER_NOT_FOUND: u64 = 2;

#[test]
fun test_recover_signature() {
    let signature = x"3e46aabdce1293d4b96baa431708bfa0a5ac41ed4eed8401fb090bd987c161c009b3dd2131617e673b3619fd1c1a44c63e26efd2e3b838055c340d2531db3ffd1c";
    let msg = x"42414c5f73415641585f4156415800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aca4bc340192a6d8f79000000020000001";
    let recovered_signer = recover_address(
        &msg,
        &signature,
    );

    let signers = vector[
        x"109b4a318a4f5ddcbca6349b45f881b4137deafb",
        x"12470f7aba85c8b81d63137dd5925d6ee114952b",
        x"1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
        x"2c59617248994d12816ee1fa77ce0a64eeb456bf",
        x"83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
        x"5179834763cd2cd8349709c1c0d52137a3df718b",
        x"cd83efdf3c75b6f9a1ff300f46ac6f652792c98c",
        x"b3da302750179b2c7ea6bd3691965313addc3245",
        x"336b78b15b6ff9cc05c276d406dcd2788e6b5c5a",
        x"57331c48c0c6f256f899d118cb4d67fc75f07bee",
    ];

    let mut i = 0;
    let signers_len = vector::length(&signers);
    while (i < signers_len) {
        let _signer = vector::borrow(&signers, i);
        if (recovered_signer == _signer) {
            break
        };
        i = i + 1;
        if (i == signers_len) {
            abort E_SIGNER_NOT_FOUND
        };
    };
}
