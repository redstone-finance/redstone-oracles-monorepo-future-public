use ::tests::{price_adapter, price_feed, price_relay_adapter};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        return println!(
            "Usage: {} [price_adapter|price_feed|price_relay_adapter]",
            args[0]
        );
    }

    match args[1].as_str() {
        "price_adapter" => price_adapter::run::run(),
        "price_feed" => price_feed::run::run(),
        "price_relay_adapter" => price_relay_adapter::run::run(),
        _ => panic!("Unknown module!"),
    }
}
