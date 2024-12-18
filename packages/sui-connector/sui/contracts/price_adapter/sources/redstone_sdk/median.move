module redstone_price_adapter::redstone_sdk_median;

// Error codes
const E_MEDIAN_ERROR_EMPTY_VECTOR: u64 = 0;

public fun calculate_median(values: &mut vector<u256>): u256 {
    let len = vector::length(values);
    assert!(len > 0, E_MEDIAN_ERROR_EMPTY_VECTOR);

    // Optimized paths for small vectors
    if (len == 1) {
        return *vector::borrow(values, 0)
    };

    if (len == 2) {
        let a = *vector::borrow(values, 0);
        let b = *vector::borrow(values, 1);
        return a / 2 + b / 2 + (a % 2 + b % 2) / 2
    };

    if (len == 3) {
        let a = *vector::borrow(values, 0);
        let b = *vector::borrow(values, 1);
        let c = *vector::borrow(values, 2);

        // Find middle value without sorting
        if (a <= b) {
            if (b <= c) {
                return b // a <= b <= c
            } else if (a <= c) {
                return c // a <= c < b
            } else {
                return a // c < a <= b
            }
        } else {
            // b < a
            if (a <= c) {
                return a // b < a <= c
            } else if (b <= c) {
                return c // b <= c < a
            } else {
                return b // c < b < a
            }
        }
    };

    sort(values);

    if (len % 2 == 1) {
        *vector::borrow(values, len / 2)
    } else {
        let mid1 = *vector::borrow(values, len / 2 - 1);
        let mid2 = *vector::borrow(values, len / 2);

        // Safe arithmetic mean calculation to avoid overflow
        mid1 / 2 + mid2 / 2 + (mid1 % 2 + mid2 % 2) / 2
    }
}

/// `sort` uses insertion sort O(n^2), O(1)
public fun sort(values: &mut vector<u256>) {
    let len = values.length();
    let mut i = 1;
    while (i < len) {
        let key = values[i];
        let mut j = i;
        while (j > 0 && values[j - 1] > key) {
            vector::swap(values, j - 1, j);
            j = j - 1;
        };
        i = i + 1;
    };
}

#[test]
fun test_median() {
    let mut values = vector[1, 3, 2];
    assert!(calculate_median(&mut values) == 2, 0);

    let mut values = vector[1, 2, 3, 4];
    assert!(calculate_median(&mut values) == 2, 1);

    let mut values = vector[1];
    assert!(calculate_median(&mut values) == 1, 2);

    let mut values = vector[5, 2, 8, 1, 9];
    assert!(calculate_median(&mut values) == 5, 4);
}

#[test]
fun test_median_with_max_values() {
    let mut values = vector[];
    let max_value = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    let mut i = 0;
    while (i < 100) {
        vector::push_back(&mut values, max_value);
        i = i + 1;
    };

    let result = calculate_median(&mut values);
    assert!(result == max_value, 0);
}

#[test]
fun test_median_avg() {
    let mut values = vector[];
    let max_value = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    let diff = 10u256;

    vector::push_back(&mut values, max_value);
    vector::push_back(&mut values, max_value);
    vector::push_back(&mut values, max_value - diff);
    vector::push_back(&mut values, max_value - diff);

    let result = calculate_median(&mut values);
    assert!(result == max_value - (diff / 2), 0);
}

#[test]
fun test_median_small_vectors() {
    let mut values = vector[1];
    assert!(calculate_median(&mut values) == 1, 0);

    let mut values = vector[1, 2];
    assert!(calculate_median(&mut values) == 1, 1);

    let mut values = vector[1, 2, 3];
    assert!(calculate_median(&mut values) == 2, 2);

    let mut values = vector[3, 1, 2];
    assert!(calculate_median(&mut values) == 2, 3);

    let mut values = vector[2, 3, 1];
    assert!(calculate_median(&mut values) == 2, 4);
}

#[test]
fun test_median_basic() {
    let mut items: vector<u256> = vector[150, 100, 250, 200];
    let expected_median = 175;
    let median = calculate_median(&mut items);
    assert!(median == expected_median);
}

#[test]
fun test_sort() {
    let mut items: vector<vector<u256>> = vector[
        vector[5123, 123, 55, 12, 518, 123, 123, 90, 123, 123],
        vector[1, 2, 3, 4, 5, 6, 7],
        vector[7, 6, 5, 4, 3, 2, 1],
        vector[7, 1, 2, 3, 4, 5, 6],
        vector[7, 6, 2, 3, 4, 5, 1],
    ];
    let expected = vector[
        vector[12, 55, 90, 123, 123, 123, 123, 123, 518, 5123],
        vector[1, 2, 3, 4, 5, 6, 7],
        vector[1, 2, 3, 4, 5, 6, 7],
        vector[1, 2, 3, 4, 5, 6, 7],
        vector[1, 2, 3, 4, 5, 6, 7],
    ];
    assert!(items.length() == expected.length());

    let mut i = 0;
    while (i < expected.length()) {
        sort(&mut items[i]);
        assert!(items[i] == expected[i], i);
        i = i + 1;
    }
}
