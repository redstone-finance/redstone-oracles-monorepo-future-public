#[cfg(not(feature = "test_sim_env"))]
pub(crate) type PriceAdapterEnv = crate::env::test_env::PriceAdapterTestEnv;

#[cfg(feature = "test_sim_env")]
pub(crate) type PriceAdapterEnv = crate::env::sim_env::PriceAdapterSimEnv;

mod get_prices_tests;
mod instantiate_tests;
mod write_prices_tests;
