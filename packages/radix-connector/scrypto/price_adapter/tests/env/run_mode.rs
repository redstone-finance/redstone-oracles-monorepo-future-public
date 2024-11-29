#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u8)]
pub enum RunMode {
    Get = 0,
    Write,
}
