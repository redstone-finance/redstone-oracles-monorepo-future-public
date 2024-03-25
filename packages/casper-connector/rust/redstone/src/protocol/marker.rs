use crate::{
    network::{assert::Assert, error::Error},
    protocol::constants::{REDSTONE_MARKER, REDSTONE_MARKER_BS},
    utils::trim::Trim,
};

pub fn trim_redstone_marker(payload: &mut Vec<u8>) {
    let marker: Vec<u8> = payload.trim_end(REDSTONE_MARKER_BS);

    marker.as_slice().assert_or_revert(
        |&marker| marker == REDSTONE_MARKER,
        |&val| Error::WrongRedStoneMarker(val.into()),
    );
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod tests {
    use crate::{
        helpers::hex::hex_to_bytes,
        protocol::{constants::REDSTONE_MARKER_BS, marker::trim_redstone_marker},
    };

    const PAYLOAD_TAIL: &str = "1c000f000000000002ed57011e0000";

    #[test]
    fn test_trim_redstone_marker() {
        let mut bytes = hex_to_bytes(PAYLOAD_TAIL.into());
        trim_redstone_marker(&mut bytes);

        assert_eq!(
            bytes,
            hex_to_bytes(PAYLOAD_TAIL[..PAYLOAD_TAIL.len() - 2 * REDSTONE_MARKER_BS].into())
        );
    }

    #[should_panic(expected = "Wrong RedStone marker: 000002ed57022e0000")]
    #[test]
    fn test_trim_redstone_marker_wrong() {
        trim_redstone_marker(&mut hex_to_bytes(PAYLOAD_TAIL.replace('1', "2")));
    }

    #[should_panic(expected = "Wrong RedStone marker: 00000002ed57011e00")]
    #[test]
    fn test_trim_redstone_marker_wrong_ending() {
        trim_redstone_marker(&mut hex_to_bytes(
            PAYLOAD_TAIL[..PAYLOAD_TAIL.len() - 2].into(),
        ));
    }

    #[should_panic(expected = "Wrong RedStone marker: 100002ed57011e0000")]
    #[test]
    fn test_trim_redstone_marker_wrong_beginning() {
        trim_redstone_marker(&mut hex_to_bytes(
            PAYLOAD_TAIL.replace("0000000", "1111111"),
        ));
    }

    #[should_panic(expected = "Wrong RedStone marker: 0002ed57011e0000")]
    #[test]
    fn test_trim_redstone_marker_too_short() {
        trim_redstone_marker(&mut hex_to_bytes(
            PAYLOAD_TAIL[PAYLOAD_TAIL.len() - 2 * (REDSTONE_MARKER_BS - 1)..].into(),
        ));
    }
}
