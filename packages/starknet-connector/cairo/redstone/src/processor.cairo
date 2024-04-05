use core::array::ArrayTrait;
use core::dict::Felt252DictTrait;
use core::integer::u32_safe_divmod;
use core::option::OptionTrait;
use core::traits::{DivRem, IndexView, Into};
use redstone::aggregation::aggregate_values;
use redstone::config::{Config, ConfigurableTrait, index_in_array};
use redstone::config_validation::ValidableTrait;
use redstone::dict::OptionalDictTrait;
use redstone::index_of::IndexOfTrait;
use redstone::numbers::Felt252PartialOrd;
use redstone::protocol::{DataPackage, DataPoint, get_payload_from_bytes, Payload};
use redstone::results::Results;

pub fn process_payload(payload_bytes: Array<u8>, config: Config) -> Results {
    let payload = get_payload_from_bytes(arr: payload_bytes, validator: config);
    let mut dict: Felt252Dict<felt252> = OptionalDictTrait::new_of_size(config.cap());
    make_values_dict(data_packages: payload.data_packages, :config, index: 0_usize, ref :dict);

    let mut tmp_arr: Array<felt252> = Default::default();
    let mut matrix: Array<@Array<felt252>> = Default::default();
    make_values_matrix(ref :dict, :config, index: 0_usize, ref :tmp_arr, ref :matrix);

    let mut aggregated_values: Array<felt252> = Default::default();
    aggregate_values(values: @matrix, index: 0_usize, ref res: aggregated_values);

    let min_timestamp = get_min_timestamp(
        data_packages: payload.data_packages, index: 0, acc: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
    );

    Results { min_timestamp, aggregated_values: @aggregated_values, values: @matrix }
}

fn make_values_matrix(
    ref dict: Felt252Dict<felt252>,
    config: Config,
    index: usize,
    ref tmp_arr: Array<felt252>,
    ref matrix: Array<@Array<felt252>>
) {
    let (feed_index, signer_index) = (index / config.signers.len(), index % config.signers.len());

    if (signer_index == 0_usize) {
        if (index != 0_usize) {
            config.validate_signer_count(feed_index: feed_index - 1, count: tmp_arr.len());
            matrix.append(@tmp_arr);
        }
        tmp_arr = Default::default();
    }

    if (index == config.cap()) {
        return ();
    }

    let price = dict
        .get_or_none(
            index_in_array(:feed_index, :signer_index, signer_count: config.signers.len()).into()
        );

    match (price) {
        Option::Some(x) => tmp_arr.append(x),
        Option::None(()) => (),
    }
    make_values_matrix(ref :dict, :config, index: index + 1_usize, ref :tmp_arr, ref :matrix);
}

fn make_values_dict(
    data_packages: @Array<DataPackage>, config: Config, index: usize, ref dict: Felt252Dict<felt252>
) {
    if (index == data_packages.len()) {
        return ();
    }

    let data_package = *data_packages[index];
    let signer_index = config.validate_signer(data_package);

    match signer_index {
        Option::Some(index) => insert_data_point_values(
            data_points: data_package.data_points,
            :config,
            signer_index: index,
            index: 0_usize,
            ref :dict
        ),
        Option::None(()) => (),
    }
    make_values_dict(:data_packages, :config, index: index + 1_usize, ref :dict)
}

fn insert_data_point_values(
    data_points: @Array<DataPoint>,
    config: Config,
    signer_index: usize,
    index: usize,
    ref dict: Felt252Dict<felt252>
) {
    if (index == data_points.len()) {
        return ();
    }

    let data_point = *data_points[index];
    let index_in_array = config.index_in_array(feed_id: data_point.feed_id, :signer_index);

    match index_in_array {
        Option::Some(x) => dict.insert(x.into(), data_point.value),
        Option::None(()) => (),
    }

    insert_data_point_values(
        :data_points, :config, :signer_index, index: index + 1_usize, ref :dict
    )
}

fn get_min_timestamp(data_packages: @Array<DataPackage>, index: usize, acc: felt252) -> felt252 {
    if (index == data_packages.len()) {
        return acc;
    }

    let timestamp: felt252 = *data_packages.at(index).timestamp;

    let value = if (timestamp < acc) {
        timestamp
    } else {
        acc
    };

    get_min_timestamp(:data_packages, index: index + 1, acc: value)
}
