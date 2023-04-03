%lang starknet

@contract_interface
namespace IPriceManager {
    func read_price(feed_id: felt) -> (value: felt) {
    }

    func read_round_data() -> (
        payload_timestamp: felt, round: felt, block_number: felt, block_timestamp: felt
    ) {
    }
}
