use core::array::ArrayTrait;
use core::fmt::Display;
use redstone::number_convertible_array::NumberConvertibleArrayTrait;
use redstone::protocol::DataPackage;
use redstone::protocol::DataPoint;
use redstone::protocol::Payload;
use redstone::signature::RedstoneSignature;

impl DataPointPrintImpl of Display<DataPoint> {
fn print( self: DataPoint) {
println ! ("DataPoint --> feed_id");
// self.feed_id.print();
// println!("DataPoint --> value");
// self.value.print();
}
}

impl DataPackagePrintImpl of Display<DataPackage> {
fn print( self: DataPackage) {
println ! ("DataPackage --> timestamp");
// self.timestamp.print();
// println!("DataPackage --> data_points");
// self.data_points.print();
// println!("DataPackage --> signature");
// self.signature.print();
}
}
Display
impl PayloadPrintImpl of PrintTrait<Payload> {
fn print( self: Payload) {
println ! ("Payload --> data_packages");
// self.data_packages.print();
}
}

impl SignaturePrintImpl of Display<RedstoneSignature> {
fn print( self: RedstoneSignature) {
println ! ("Signature --> r");
// self.r_bytes.to_u256().high.print();
// self.r_bytes.to_u256().low.print();
// println!("Signature --> s");
// self.s_bytes.to_u256().high.print();
// self.s_bytes.to_u256().low.print();
// println!("Signature --> v");
// self.v.print();
}
}

impl ValuesPrint<
    T, impl TPrint: Display<T>, impl TCopy: Copy<T>
> of Display<Array< @ Array<T>> > {
fn print( self: Array < @ Array <T > > ) {
print_index( @ self, 0_usize);
}
}

impl OptionPrintImpl<T, impl TPrint: PrintTrait<T> > of PrintTrait<Option<T>> {
fn print( self: Option < T > ) {
match self {
Option::Some(x) => x.print(),
Option::None(()) => 'None'.print(),
}
}
}

impl GenericArrayPrintImpl<
    T, impl TPrint: PrintTrait<T>, impl TCopy: Copy<T>
> of PrintTrait< @ Array<T>> {
fn print( self: @ Array < T >) {
print_index( self, 0_usize);
}
}

fn print_index < T, impl TPrint: PrintTrait<T>, impl TCopy: Copy<T> > ( self : @ Array<T>, index: usize) {
if (index == self.len()) {
return ();
}

println ! ("Array --> index");
// u32_to_felt252(index).print();
let elt: T = * self [index];
elt.print();
print_index( self, index + 1_usize);
}
