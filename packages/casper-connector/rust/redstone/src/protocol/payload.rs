use crate::{
    network::{assert::Assert, error::Error},
    protocol::{
        constants::{DATA_PACKAGES_COUNT_BS, UNSIGNED_METADATA_BYTE_SIZE_BS},
        data_package::{trim_data_packages, DataPackage},
        marker,
    },
    utils::trim::Trim,
};

#[derive(Clone, Debug)]
pub(crate) struct Payload {
    pub(crate) data_packages: Vec<DataPackage>,
}

impl Payload {
    pub(crate) fn make(payload_bytes: &mut Vec<u8>) -> Payload {
        marker::trim_redstone_marker(payload_bytes);
        let payload = trim_payload(payload_bytes);

        payload_bytes.assert_or_revert(
            |bytes| bytes.is_empty(),
            |bytes| Error::NonEmptyPayloadRemainder(bytes.as_slice().into()),
        );

        payload
    }
}

fn trim_payload(payload: &mut Vec<u8>) -> Payload {
    let data_package_count = trim_metadata(payload);
    let data_packages = trim_data_packages(payload, data_package_count);

    Payload { data_packages }
}

fn trim_metadata(payload: &mut Vec<u8>) -> usize {
    let unsigned_metadata_size = payload.trim_end(UNSIGNED_METADATA_BYTE_SIZE_BS);
    let _: Vec<u8> = payload.trim_end(unsigned_metadata_size);

    payload.trim_end(DATA_PACKAGES_COUNT_BS)
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod tests {
    use crate::{
        helpers::hex::{hex_to_bytes, read_payload_bytes, read_payload_hex},
        protocol::{
            constants::REDSTONE_MARKER_BS,
            payload::{trim_metadata, trim_payload, Payload},
        },
    };

    const PAYLOAD_METADATA_BYTES: &str = "000f000000";
    const PAYLOAD_METADATA_WITH_UNSIGNED_BYTE: &str = "000f55000001";
    const PAYLOAD_METADATA_WITH_UNSIGNED_BYTES: &str = "000f11223344556677889900aabbccddeeff000010";

    #[test]
    fn test_trim_metadata() {
        let prefix = "9e0294371c";

        for &bytes_str in &[
            PAYLOAD_METADATA_BYTES,
            PAYLOAD_METADATA_WITH_UNSIGNED_BYTE,
            PAYLOAD_METADATA_WITH_UNSIGNED_BYTES,
        ] {
            let mut bytes = hex_to_bytes(prefix.to_owned() + bytes_str);
            let result = trim_metadata(&mut bytes);

            assert_eq!(bytes, hex_to_bytes(prefix.into()));
            assert_eq!(result, 15);
        }
    }

    #[test]
    fn test_trim_payload() {
        let payload_hex = read_payload_bytes("./sample-data/payload.hex");

        let mut bytes = payload_hex[..payload_hex.len() - REDSTONE_MARKER_BS].into();
        let payload = trim_payload(&mut bytes);

        assert_eq!(bytes, Vec::<u8>::new());
        assert_eq!(payload.data_packages.len(), 15);
    }

    #[test]
    fn test_make_payload() {
        let mut payload_hex = read_payload_bytes("./sample-data/payload.hex");
        let payload = Payload::make(&mut payload_hex);

        assert_eq!(payload.data_packages.len(), 15);
    }

    #[should_panic(expected = "Non empty payload remainder: 12")]
    #[test]
    fn test_make_payload_with_prefix() {
        let payload_hex = read_payload_hex("./sample-data/payload.hex");
        let mut bytes = hex_to_bytes("12".to_owned() + &payload_hex);
        let payload = Payload::make(&mut bytes);

        assert_eq!(payload.data_packages.len(), 15);
    }
}
