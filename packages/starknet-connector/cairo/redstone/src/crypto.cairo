use core::array::{ArrayTrait, SpanTrait};
use core::ecdsa::check_ecdsa_signature;
use core::hash::LegacyHash;
use core::integer::u128_byte_reverse;
use core::option::OptionTrait;
use core::traits::{Into, TryInto};
use keccak::cairo_keccak;
use redstone::number_convertible_array::NumberConvertibleArrayTrait;
use redstone::signature::RedstoneSignature;
use starknet::eth_signature::public_key_point_to_eth_address;
use starknet::EthAddress;
use starknet::secp256_trait::{recover_public_key, signature_from_vrs};
use starknet::secp256k1::Secp256k1Point;

pub(crate) trait VerifiableTrait<T> {
    fn recover(message_hash: u256, signature: RedstoneSignature) -> Option<felt252>;
    fn hash(self: @Array<T>) -> u256;
}

pub(crate) impl VerifiableU8Array of VerifiableTrait<u8> {
    fn recover(message_hash: u256, signature: RedstoneSignature) -> Option<felt252> {
        let key = recover_public_key::<
            Secp256k1Point
        >(
            msg_hash: message_hash,
            signature: signature_from_vrs(
                signature.v, signature.r_bytes.to_u256(), signature.s_bytes.to_u256()
            )
        );

        match key {
            Option::Some(pub_key) => {
                let addr: EthAddress = public_key_point_to_eth_address(pub_key);

                Option::Some(addr.into())
            },
            Option::None(_) => Option::None(())
        }
    }

    fn hash(self: @Array<u8>) -> u256 {
        let mut span = self.span();
        let mut keccak_input: Array::<u64> = Default::default();
        let (size, value) = span_keccak_input_le(
            arr: span, index: 0_usize, mlt: 1, value: 0, ref result: keccak_input
        );

        let res = cairo_keccak(
            ref input: keccak_input, last_input_word: value, last_input_num_bytes: size
        );

        u256 { high: u128_byte_reverse(res.low), low: u128_byte_reverse(res.high) }
    }
}


fn span_keccak_input_le(
    mut arr: Span<u8>, index: usize, mlt: u64, value: u64, ref result: Array<u64>
) -> (usize, u64) {
    if (index == 8) {
        result.append(value);

        return span_keccak_input_le(:arr, index: 0, mlt: 1, value: 0, ref :result);
    }

    let item = arr.pop_front();
    match item {
        Option::Some(x) => {
            return span_keccak_input_le(
                :arr,
                index: index + 1_usize,
                mlt: if (index == 7) {
                    0
                } else {
                    mlt * 256
                },
                value: value + mlt * (*x).into(),
                ref :result
            );
        },
        Option::None(_) => { return (index, value); },
    }
}
