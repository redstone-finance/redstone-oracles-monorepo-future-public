#[cfg(not(feature = "test_sim_env"))]
pub(crate) type PriceAdapterEnv = crate::env::test_env::MultiFeedPriceAdapterTestEnv;

#[cfg(feature = "test_sim_env")]
pub(crate) type PriceAdapterEnv = crate::env::sim_env::MultiFeedPriceAdapterSimEnv;

mod get_prices_tests;
mod instantiate_tests;
mod write_prices_tests;
