fn main() {
    if let Ok(value) = std::env::var("FORCE_REAL_NETWORK_TEST") {
        if value == "true" {
            println!("cargo:rustc-cfg=feature=\"real_network_test\"");
        }
    }

    println!("cargo:rerun-if-env-changed=FORCE_REAL_NETWORK_TEST");
    println!("cargo:rerun-if-feature-changed=test_sim_env");
    println!("cargo:rerun-if-feature-changed=real_network");
    println!("cargo:rerun-if-feature-changed=real_network_test");
}
