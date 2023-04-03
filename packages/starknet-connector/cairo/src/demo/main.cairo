%builtins output range_check bitwise

from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

from redstone.protocol.payload import serialize_payload
from redstone.utils.array import serialize_array
from redstone.core.results import Results, serialize_results

from demo.execute import execute

func main{output_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*}() {
    alloc_locals;

    let (payload, results, aggregated) = execute(test_id=0);

    serialize_payload(payload);
    serialize_results(arr=results, index=0);
    serialize_array(arr=aggregated, index=0);

    return ();
}
