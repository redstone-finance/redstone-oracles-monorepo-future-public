// === Imports ===

module redstone_price_adapter::redstone_sdk_crypto;

use redstone_price_adapter::redstone_sdk_conv::from_bytes_to_u256;

// === Errors ===

const E_INVALID_SIGNATURE_LEN: u64 = 0;
const E_INVALID_RECOVERY_ID: u64 = 1;
const E_INVALID_VECTOR_LEN: u64 = 2;
const E_INVALID_SIGNATURE: u64 = 3;

// === Constants ===

const ECDSA_N_DIV_2: u256 = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

// === Public Functions ===

/// `recover_address` doesn't check the signature validity, it just recovers the address.
/// the signatures are validated at a later step by checking if the
/// recovered signers are present in the configured signers array and meets
/// the minimum signers threshold
///
/// the function might abort with invalid signature error if address recovery fails
public fun recover_address(msg: &vector<u8>, signature: &vector<u8>): vector<u8> {
    assert!(signature.length() == 65, E_INVALID_SIGNATURE_LEN);

    // Create a mutable copy of the signature
    let mut sig = *signature;

    // Extract the 'v' value and ensure it's in the range {0, 1}
    let v = sig[64];
    let v = if (v >= 27) {
        v - 27
    } else {
        v
    };
    assert!(v <2, E_INVALID_RECOVERY_ID);
    check_s(&sig);

    // Replace the last byte of the signature with the adjusted recovery byte
    *&mut sig[64] = v;

    let keccak_hash_function_type = 0;
    let compressed_public_key = sui::ecdsa_k1::secp256k1_ecrecover(
        &sig,
        msg,
        keccak_hash_function_type,
    );
    let public_key = sui::ecdsa_k1::decompress_pubkey(&compressed_public_key);

    let key_hash = sui::hash::keccak256(
        &last_n_bytes(
            &public_key,
            public_key.length() - 1,
        ),
    );

    let recovered_address = last_n_bytes(&key_hash, 20);

    recovered_address
}

// === Private Functions ===

fun check_s(signature: &vector<u8>) {
    // signature = [r0..r31][s0..s31][v]
    let s = vector::tabulate!(32, |i| signature[32 + i]);
    let s_number = from_bytes_to_u256(&s);

    assert!(s_number <= ECDSA_N_DIV_2, E_INVALID_SIGNATURE);
}

fun last_n_bytes(input: &vector<u8>, n: u64): vector<u8> {
    let len = input.length();
    assert!(n <= len, E_INVALID_VECTOR_LEN);

    let start_idx = len - n;
    // input[start_idx...]
    vector::tabulate!(n, |i| input[start_idx + i])
}

// === Test Functions ===

#[test]
fun test_recover_signature() {
    let signature =
        x"3e46aabdce1293d4b96baa431708bfa0a5ac41ed4eed8401fb090bd987c161c009b3dd2131617e673b3619fd1c1a44c63e26efd2e3b838055c340d2531db3ffd1c";
    let msg =
        x"42414c5f73415641585f4156415800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aca4bc340192a6d8f79000000020000001";
    let expected_signer = x"109b4a318a4f5ddcbca6349b45f881b4137deafb";

    let recovered_signer = recover_address(
        &msg,
        &signature,
    );

    assert!(recovered_signer == expected_signer);
}

#[test]
fun test_recover_v27() {
    let msg =
        x"415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d394303d018d79bf0ba000000020000001";
    let signature =
        x"475195641dae43318e194c3d9e5fc308773d6fdf5e197e02644dfd9ca3d19e3e2bd7d8656428f7f02e658a16b8f83722169c57126cc50bec8fad188b1bac6d191b";
    let expected_signer = x"2c59617248994D12816EE1Fa77CE0a64eEB456BF";

    let recovered_signer = recover_address(
        &msg,
        &signature,
    );

    assert!(recovered_signer == expected_signer);
}

#[test]
fun test_recover_v28() {
    let msg =
        x"415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d394303d018d79bf0ba000000020000001";
    let signature =
        x"c88242d22d88252c845b946c9957dbf3c7d59a3b69ecba2898198869f9f146ff268c3e47a11dbb05cc5198aadd659881817a59ee37e088d3253f4695927428c11c";
    let expected_signer = x"12470f7aBA85c8b81D63137DD5925D6EE114952b";

    let recovered_signer = recover_address(
        &msg,
        &signature,
    );

    assert!(recovered_signer == expected_signer);
}

#[test]
#[expected_failure(abort_code = E_INVALID_SIGNATURE_LEN)]
fun invalida_signature_len() {
    // msg len is 64 should be 65
    let msg =
        x"415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d394303d018d79bf0ba000000020000001";
    let signature = vector[];

    let _ = recover_address(
        &msg,
        &signature,
    );
}

#[test]
#[expected_failure(abort_code = E_INVALID_RECOVERY_ID)]
fun invalid_recovery_byte() {
    let msg =
        x"415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d394303d018d79bf0ba000000020000001";
    let signature = vector::tabulate!(65, |_| 255); // recovery byte too large

    let _ = recover_address(
        &msg,
        &signature,
    );
}

#[test]
#[expected_failure(abort_code = E_INVALID_SIGNATURE)]
fun malleabillity() {
    let msg =
        x"4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000058f32c910a001924dc0bd5000000020000001";

    let signature =
        x"6307247862e106f0d4b3cde75805ababa67325953145aa05bdd219d90a741e0eeba79b756bf3af6db6c26a8ed3810e3c584379476fd83096218e9deb95a7617e1b";

    let _ = recover_address(
        &msg,
        &signature,
    );
}
