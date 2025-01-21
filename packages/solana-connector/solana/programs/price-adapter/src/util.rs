use anchor_lang::prelude::{Clock, Result, SolanaSysvar};

use redstone::TimestampMillis;

pub fn make_price_seed() -> [u8; 32] {
    let mut seed = [0u8; 32];
    seed[0..5].copy_from_slice(b"price");
    seed
}

#[cfg(feature = "dev")]
pub fn bytes_to_hex(bytes: &[u8]) -> String {
    use std::fmt::Write;
    bytes
        .iter()
        .fold(String::with_capacity(bytes.len() * 2), |mut output, b| {
            let _ = write!(output, "{:02x}", b);
            output
        })
}

/// Log a msg in dev mode
pub fn debug_msg<F: Fn() -> String>(_msg_fn: F) {
    #[cfg(feature = "dev")]
    {
        use anchor_lang::prelude::msg;
        msg!("{}", _msg_fn())
    }
}

pub fn current_time_as_millis() -> Result<TimestampMillis> {
    Ok((Clock::get()?.unix_timestamp as u64 * 1000).into())
}
