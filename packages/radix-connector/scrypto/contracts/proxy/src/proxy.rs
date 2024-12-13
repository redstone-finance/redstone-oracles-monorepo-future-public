use scrypto::prelude::*;

#[blueprint]
mod proxy {
    enable_method_auth! {
        roles {
            proxy_man_auth => updatable_by: [];
        },
        methods {
            set_contract_global_address => restrict_to: [proxy_man_auth, OWNER];
            call_method => PUBLIC;
        }
    }

    struct Proxy {
        contract_global_address: Option<Global<AnyComponent>>,
    }

    impl Proxy {
        pub fn instantiate(
            owner_badge: NonFungibleGlobalId,
            man_badge: NonFungibleGlobalId,
            contract_global_address: Option<Global<AnyComponent>>,
        ) -> Global<Proxy> {
            let owner_role = OwnerRole::Fixed(rule!(require(owner_badge)));
            let man_rule = rule!(require(man_badge));

            info!("[Proxy] instantiate()");
            Self {
                contract_global_address,
            }
            .instantiate()
            .prepare_to_globalize(owner_role)
            .roles(roles! {
                proxy_man_auth => man_rule;
            })
            .globalize()
        }

        // Specify Oracle component address
        pub fn set_contract_global_address(&mut self, address: Global<AnyComponent>) {
            info!("[Proxy] set_contract_address() address = {:?}", address);
            self.contract_global_address = Some(address);
        }

        // This method allows to call any method from configured component by method name.
        // Method arguments must be encoded into ScryptoValue tuple of arguments.
        // It might be achieved by converting the arguments into ManifestValue, eg.
        //   - 2 arguments
        //   `let manifest_value = to_manifest_value(&(arg1, arg2))`
        //   - 1 argument
        //   `let manifest_value = to_manifest_value(&(arg1, ))`
        //   - no arguments
        //   `let manifest_value = to_manifest_value(&())`
        //
        //   So the full example could look like this
        //   ```
        //   let manifest = ManifestBuilder::new()
        //     .lock_fee_from_faucet()
        //     .call_method(
        //         proxy_component_address,
        //         "call_method",
        //         manifest_args!(
        //             "get_price",
        //             to_manifest_value(&("XRD".to_string(),)).unwrap()
        //         ),
        //     )
        //     .build();
        //  ```
        pub fn call_method(&self, method_name: String, args: ScryptoValue) -> ScryptoValue {
            let args = scrypto_encode(&args).unwrap();
            info!(
                "[Proxy] call_method() method_name = {:?} args = {:?}",
                method_name, args
            );

            let bytes = ScryptoVmV1Api::object_call(
                self.contract_global_address
                    .expect("contract_global_address is not set")
                    .handle()
                    .as_node_id(),
                &method_name,
                args,
            );
            let return_value = scrypto_decode(&bytes).unwrap();
            info!("[Proxy] call_method() return_value = {:?}", return_value);
            return_value
        }
    }
}
