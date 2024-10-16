library;

abi Metadata {
    /// Returns the current version of the contract.
    fn get_version() -> u64;

    /// Returns the unique signer threshold, which the contract is set up.
    fn get_unique_signer_threshold() -> u64;
}
