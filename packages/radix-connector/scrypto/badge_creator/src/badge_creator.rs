use scrypto::prelude::*;

#[derive(ScryptoSbor, NonFungibleData)]
pub struct RedstoneBadge {
    text: String,
}

#[blueprint]
mod badge_creator {
    struct BadgeCreator {}

    impl BadgeCreator {
        pub fn create_badges() -> Bucket {
            let bucket: NonFungibleBucket = ResourceBuilder::new_ruid_non_fungible(OwnerRole::None)
                .metadata(metadata! {
                    init {
                        "name" => "RedStone Proxy", locked;
                    }
                })
                .mint_initial_supply([
                    RedstoneBadge {
                        text: "Owner".into(),
                    },
                    RedstoneBadge { text: "Man".into() },
                ]);

            bucket.into()
        }
    }
}
