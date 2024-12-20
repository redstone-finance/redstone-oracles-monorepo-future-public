use scrypto::prelude::*;

#[derive(ScryptoSbor)]
pub enum Time {
    System,
    Mock(u64),
}

impl Time {
    pub fn get_current_in_ms(&self) -> u64 {
        let time = match self {
            Time::Mock(seconds) => *seconds,
            _ => get_current_time(),
        };

        time * 1000
    }

    pub fn maybe_increase(&mut self, seconds: u64) {
        match self {
            Time::Mock(previous) => *self = Time::Mock(*previous + seconds),
            _ => return,
        }
    }
}

impl From<Option<u64>> for Time {
    fn from(value: Option<u64>) -> Self {
        match value {
            #[cfg(any(feature = "real_network_test", not(feature = "real_network")))]
            Some(value) => Self::Mock(value),
            #[cfg(not(any(feature = "real_network_test", not(feature = "real_network"))))]
            Some(_) => Self::System,
            None => Self::System,
        }
    }
}

pub fn get_current_time() -> u64 {
    Clock::current_time_rounded_to_seconds().seconds_since_unix_epoch as u64
}
