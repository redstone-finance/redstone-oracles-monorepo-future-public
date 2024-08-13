extern crate alloc;

use alloc::collections::BTreeMap;

use casper_types::bytesrepr::Bytes;

pub type Dic<T> = BTreeMap<Bytes, T>;
