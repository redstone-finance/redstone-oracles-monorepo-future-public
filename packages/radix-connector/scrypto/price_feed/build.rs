fn main() {
    if let Ok(value) = std::env::var("FORCE_REAL_NETWORK") {
        if value == "true" {
            println!("cargo:rustc-cfg=feature=\"real_network\"");
        }
    }

    println!("cargo:rerun-if-env-changed=FORCE_REAL_NETWORK");
    println!("cargo:rerun-if-feature-changed=test_sim_env");
    println!("cargo:rerun-if-feature-changed=real_network");
}
