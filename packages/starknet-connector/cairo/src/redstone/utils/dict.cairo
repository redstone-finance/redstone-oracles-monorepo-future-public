from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.default_dict import default_dict_new, default_dict_finalize

struct Dict {
    ptr: DictAccess*,
}

const DICT_UNKNOWN_VALUE = -1;

func dict_new{range_check_ptr}() -> Dict {
    alloc_locals;

    let (local dict) = default_dict_new(default_value=DICT_UNKNOWN_VALUE);

    default_dict_finalize(
        dict_accesses_start=dict, dict_accesses_end=dict, default_value=DICT_UNKNOWN_VALUE
    );

    local res: Dict = Dict(ptr=dict);

    return res;
}
