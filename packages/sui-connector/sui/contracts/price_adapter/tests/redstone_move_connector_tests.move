#[test_only]
module redstone_price_adapter::tests;

use redstone_price_adapter::admin::{admin_cap, consume_cap};
use redstone_price_adapter::main;
use redstone_price_adapter::price_adapter::{Self, PriceAdapter};
use sui::clock;
use sui::test_scenario::{Self, Scenario};

const OWNER: address = @0xCAFE;

/// "BTC", 32 bytes total, 0 padded
const TEST_FEED_ID: vector<u8> =
    x"4254430000000000000000000000000000000000000000000000000000000000";

const TEST_PAYLOAD: vector<u8> =
    x"42544300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000063ab67468b10192aadf8bb0000000200000012bdab86371c29cc8e723548657d7089f9f8a69d2d5cd7c49eae32809e20d92a35cfc5d6aa90673a8e2a6706f5aed1bfdbee12f10d0720e0ceb2c6ef4bc60065b1c42544300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000063ab67468b10192aadf8bb0000000200000018fd7afec67a256122a6757a315b390de5af7d3f13ef2e6e953bfb672248fd35e651eb9462e56e8621ffae734ddf0cd12fdf0b94d4deee0b5137b7ba505a0d6571c42544300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000063ab683a97b0192aadf8bb000000020000001b1d057b37e2a1886dc5e1f1417f3f0b696c33e5db2806e514e6fd5f5a5d02a9a2e5d03943a6dfe5b25df63606902719e1f872e45875e11900280fffdfc35dd591b0003000000000002ed57011e0000";

const TEST_PAYLOAD_PRICE: u256 = 6849238952113;

const SIGNERS: vector<vector<u8>> = vector[
    x"109b4a318a4f5ddcbca6349b45f881b4137deafb",
    x"12470f7aba85c8b81d63137dd5925d6ee114952b",
    x"1ea62d73edf8ac05dfcea1a34b9796e937a29eff",
    x"2c59617248994d12816ee1fa77ce0a64eeb456bf",
    x"83cba8c619fb629b81a65c2e67fe15cf3e3c9747",
    x"5179834763cd2cd8349709c1c0d52137a3df718b",
    x"cd83efdf3c75b6f9a1ff300f46ac6f652792c98c",
    x"b3da302750179b2c7ea6bd3691965313addc3245",
    x"336b78b15b6ff9cc05c276d406dcd2788e6b5c5a",
    x"57331c48c0c6f256f899d118cb4d67fc75f07bee",
];

const E_PRICE_MISMATCH: u64 = 0;

#[test]
fun e2e() {
    let mut scenario = test_scenario::begin(OWNER);
    initialize_price_adapter(&mut scenario);
    write_price(&mut scenario);
    read_price(&mut scenario);

    test_scenario::end(scenario);
}

fun initialize_price_adapter(scenario: &mut Scenario) {
    test_scenario::next_tx(scenario, OWNER);
    {
        let admin_cap = admin_cap(test_scenario::ctx(scenario));
        main::initialize_price_adapter(
            &admin_cap,
            SIGNERS,
            3,
            15 * 60 * 1000, // 15 minutes
            3 * 60 * 1000, // 3 minutes
            test_scenario::ctx(scenario),
        );
        consume_cap(admin_cap);
    };
}

fun write_price(scenario: &mut Scenario) {
    test_scenario::next_tx(scenario, OWNER);
    {
        let mut price_adapter = test_scenario::take_shared<PriceAdapter>(
            scenario
        );
        let mut clock = clock::create_for_testing(test_scenario::ctx(scenario));

        // Set the clock to a specific time (adjustable)
        clock::set_for_testing(&mut clock, 1729443646868);

        let payload = TEST_PAYLOAD;

        price_adapter::write_price(
            &mut price_adapter,
            TEST_FEED_ID,
            payload,
            &clock,
        );

        test_scenario::return_shared(price_adapter);
        clock::destroy_for_testing(clock);
    };
}

fun read_price(scenario: &mut Scenario) {
    test_scenario::next_tx(scenario, OWNER);
    {
        let price_adapter = test_scenario::take_shared<PriceAdapter>(scenario);
        let (price, _timestamp) = price_adapter::price_and_timestamp(
            &price_adapter,
            TEST_FEED_ID,
        );
        assert!(price == TEST_PAYLOAD_PRICE, E_PRICE_MISMATCH);
        test_scenario::return_shared(price_adapter);
    };
}
