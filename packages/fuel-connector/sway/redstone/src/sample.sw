library sample;

dep utils/bytes;

use std::{bytes::*};
use bytes::*;

pub const SAMPLE_SIGNER_ADDRESS_0 = 0x00000000000000000000000012470f7aBA85c8b81D63137DD5925D6EE114952b;
pub const SAMPLE_SIGNER_ADDRESS_1 = 0x0000000000000000000000001ea62d73edf8ac05dfcea1a34b9796e937a29eff;

pub struct SamplePayload {
    data_packages: Vec<SampleDataPackage>,
}

pub struct SampleDataPackage {
    signable_bytes: Bytes,
    signature_r: b256,
    signature_s: b256,
    signature_v: u64,
    signer_address: b256,
}

struct SampleDataPackageInput {
    initial: [u64; 3],
    number_of_mid_zeroes: u64,
    number_low: b256,
    signature_r: b256,
    signature_s: b256,
    signature_v: u64,
    signer_address: b256,
}

pub const SAMPLE_ID_V27 = 0;
pub const SAMPLE_ID_V28 = 1;

const samples = [
    // 77 bytes are split into 3 parts, the first one consists of 3 bytes, the last one consists of 18 bytes + 14 bytes of zero-bytes, so we have 77-(3+18+14) = 42 zero-bytes inside:
    // 0x45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002603c77cf6018697ef555000000020000001
    // signature: 0x54bc55649dbae70cbf6279bc68485dfdd3d4915e0baae54e252af69f4c012faf34465a4d835255391ddfd36736b6d8dcd3fbb0ff5798419ea8c287936680bfc31b
    SampleDataPackageInput {
        initial: [0x45, 0x54, 0x48],
        number_of_mid_zeroes: 42,
        number_low: 0x00000000000000000000000000002603c77cf6018697ef555000000020000001,
        signature_r: 0x54bc55649dbae70cbf6279bc68485dfdd3d4915e0baae54e252af69f4c012faf,
        signature_s: 0x34465a4d835255391ddfd36736b6d8dcd3fbb0ff5798419ea8c287936680bfc3,
        signature_v: 0x1b,
        signer_address: SAMPLE_SIGNER_ADDRESS_0,
    },
    SampleDataPackageInput {
        initial: [0x45, 0x54, 0x48],
        number_of_mid_zeroes: 42,
        number_low: 0x0000000000000000000000000000261b2eceac01869816da8000000020000001,
        signature_r: 0xacafa79c353f3641e653d22b34e432d8b110eea51196bac884690200c0def9ac,
        signature_s: 0x672de77dbacde8ecff23e1976ee738eec9ad0a75933c6b9b52efa8dfa614fe5e,
        signature_v: 0x1c,
        signer_address: SAMPLE_SIGNER_ADDRESS_0,
    },
    SampleDataPackageInput {
        initial: [0x45, 0x54, 0x48],
        number_of_mid_zeroes: 42,
        number_low: 0x0000000000000000000000000000248b3142440186b75caeb000000020000001,
        signature_r: 0x333ecb944d5fc5de0dd6eb264ed2134cfb5e9b5db4933d9bfbdb15c4e71f70b7,
        signature_s: 0x29b1be6f047d78691cd459268213e294b4d66c544e9953b88f9f0bfb2c77159b,
        signature_v: 0x1c,
        signer_address: SAMPLE_SIGNER_ADDRESS_0,
    },
    SampleDataPackageInput {
        initial: [0x45, 0x54, 0x48],
        number_of_mid_zeroes: 42,
        number_low: 0x0000000000000000000000000000248c3218dc0186b75c87a000000020000001,
        signature_r: 0x18d7684f83d8fe57447c5e23c14ada832b6567484c02117ab9294b909b043545,
        signature_s: 0x0531c01b9882b91983032cc18504820008d798e95e1b3a68c79a11b346994a92,
        signature_v: 0x1b,
        signer_address: SAMPLE_SIGNER_ADDRESS_1,
    },
    SampleDataPackageInput {
        initial: [0x42, 0x54, 0x43],
        number_of_mid_zeroes: 42,
        number_low: 0x00000000000000000000000000020a10566cd60186b75caeb000000020000001,
        signature_r: 0x9cc8412ef90ebdb05f20ce9df33858f79787bd4a69c5165211540bdcb619a357,
        signature_s: 0x14a588656ba40b9b7b18117e7e4bee0587e83fb7f14b2d33086c4ecdb50dcedd,
        signature_v: 0x1b,
        signer_address: SAMPLE_SIGNER_ADDRESS_0,
    },
    SampleDataPackageInput {
        initial: [0x42, 0x54, 0x43],
        number_of_mid_zeroes: 42,
        number_low: 0x00000000000000000000000000020a12aa560f0186b75c87a000000020000001,
        signature_r: 0x899d1299b14281f0ed78660f2e714b8bfbe63b04c0e2ef7d355cd3b7502e1543,
        signature_s: 0x642fd04f63fbd0069da79193f98c89cd5097ac1a8e3f7cd92bc9055d276ffbc4,
        signature_v: 0x1c,
        signer_address: SAMPLE_SIGNER_ADDRESS_1,
    },
];

impl SampleDataPackage {
    pub fn sample(index: u64) -> Self {
        let input = samples[index];

        return Self {
            signature_r: input.signature_r,
            signature_s: input.signature_s,
            signature_v: input.signature_v,
            signable_bytes: signable_bytes(input.initial, input.number_of_mid_zeroes, input.number_low),
            signer_address: input.signer_address,
        }
    }

    pub fn signature_bytes(self) -> Bytes {
        return signature_bytes(self.signature_r, self.signature_s, self.signature_v);
    }
}

impl SampleDataPackage {
    fn bytes(self) -> Bytes {
        return self.signable_bytes.join(self.signature_bytes());
    }
}

impl SamplePayload {
    fn sample(indices: Vec<u64>) -> SamplePayload {
        let mut data_packages = Vec::new();
        let mut i = 0;

        while (i < indices.len) {
            data_packages.push(SampleDataPackage::sample(indices.get(i).unwrap()));
            i += 1;
        }

        return Self { data_packages }
    }

    pub fn bytes(self) -> Bytes {
        const REDSTONE_MARKER = [0x00, 0x00, 0x02, 0xed, 0x57, 0x01, 0x1e, 0x00, 0x00];
        const UNSIGNED_METADATA_BYTE_SIZE_BS = 3;
        const DATA_PACKAGES_COUNT_BS = 2;

        let mut bytes = Bytes::new();
        let mut i = 0;
        while (i < self.data_packages.len) {
            bytes.append(self.data_packages.get(i).unwrap().bytes());
            i += 1;
        }

        i = 0;
        while (i < DATA_PACKAGES_COUNT_BS - 1) {
            bytes.push(0x00);
            i += 1;
        }
        bytes.push(self.data_packages.len);  // number of data packages
        i = 0;
        while (i < UNSIGNED_METADATA_BYTE_SIZE_BS) {
            bytes.push(0x00);
            i += 1;
        }
        i = 0;
        while (i < 9) {
            bytes.push(REDSTONE_MARKER[i]);
            i += 1;
        }

        return bytes;
    }
}

fn signable_bytes(initial: [u8; 3], number_of_mid_zeroes: u8, number_low: b256) -> Bytes {
    let mut signable_bytes = Bytes::new();
    signable_bytes.push(initial[0]);
    signable_bytes.push(initial[1]);
    signable_bytes.push(initial[2]);

    let mut i = 0;
    while (i < number_of_mid_zeroes) {
        signable_bytes.push(0x00);
        i += 1;
    }

    signable_bytes.append(Bytes::from(number_low));

    return signable_bytes;
}

fn signature_bytes(r: b256, s: b256, v: u8) -> Bytes {
    let mut signature_bytes = Bytes::from(r);
    signature_bytes.append(Bytes::from(s));
    signature_bytes.push(v);

    return signature_bytes;
}

impl SamplePayload {
    pub fn big_timestamp_span() -> SamplePayload {
        let mut indices = Vec::new();
        indices.push(SAMPLE_ID_V27);
        indices.push(SAMPLE_ID_V28);

        return Self::sample(indices);
    }

    pub fn eth_btc_2x2() -> SamplePayload {
        let mut indices = Vec::new();
        indices.push(2);
        indices.push(3);
        indices.push(4);
        indices.push(5);

        return Self::sample(indices);
    }

    pub fn eth_btc_2plus1() -> SamplePayload {
        let mut indices = Vec::new();
        indices.push(2);
        indices.push(3);
        indices.push(4);

        return Self::sample(indices);
    }
}
