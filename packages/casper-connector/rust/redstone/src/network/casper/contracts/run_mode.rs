#[derive(Clone, Copy, Debug)]
#[repr(u8)]
pub enum RunMode {
    Get = 0,
    Write,
}
