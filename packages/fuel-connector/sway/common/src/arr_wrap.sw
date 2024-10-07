library;

pub trait ArrWrap {
    fn _len(self) -> u64;
    fn _get(self, i: u64) -> b256;
}

impl ArrWrap for [b256; 1] {
    fn _len(self) -> u64 {
        1
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 2] {
    fn _len(self) -> u64 {
        2
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 3] {
    fn _len(self) -> u64 {
        3
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 4] {
    fn _len(self) -> u64 {
        4
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 5] {
    fn _len(self) -> u64 {
        5
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 6] {
    fn _len(self) -> u64 {
        6
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 7] {
    fn _len(self) -> u64 {
        7
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 8] {
    fn _len(self) -> u64 {
        8
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 9] {
    fn _len(self) -> u64 {
        9
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}

impl ArrWrap for [b256; 10] {
    fn _len(self) -> u64 {
        10
    }

    fn _get(self, i: u64) -> b256 {
        self[i]
    }
}
