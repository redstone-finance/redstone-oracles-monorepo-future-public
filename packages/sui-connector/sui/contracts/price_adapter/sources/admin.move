module redstone_price_adapter::admin;

public struct ADMIN has drop {}

public struct AdminCap has key {
    id: UID,
}

fun init(_: ADMIN, ctx: &mut TxContext) {
    // One time witness ADMIN ensures only one AdminCap will ever be created
    let admin = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin, ctx.sender());
}

#[test_only]
public fun admin_cap(ctx: &mut TxContext): AdminCap {
    AdminCap { id: object::new(ctx) }
}

#[test_only]
public fun consume_cap(admin_cap: AdminCap) {
    let AdminCap { id } = admin_cap;
    id.delete();
}
