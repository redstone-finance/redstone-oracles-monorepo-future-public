module redstone_price_adapter::main {
    // === Imports ===

    use redstone_price_adapter::price_adapter;

    // === Admin Functions ===

    fun init_module(account: &signer) {
        price_adapter::new(account);
    }
}
