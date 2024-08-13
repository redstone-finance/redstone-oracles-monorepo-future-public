extern crate alloc;

use casper_types::{
    contracts::Parameters,
    CLType,
    CLType::{List, U256, U8},
    EntryPoint,
    EntryPointAccess::{Groups, Public},
    EntryPointType::Contract,
    Group, Parameter,
};

pub trait ToEntryPoint {
    fn entry_point(self, args: Parameters, return_type: CLType) -> EntryPoint;
    fn entry_point_no_params(self, return_type: CLType) -> EntryPoint;
    fn entry_point_single(self, arg: Parameter, return_type: CLType) -> EntryPoint;
    fn ownable_entry_point(
        self,
        args: Parameters,
        return_type: CLType,
        group_name: &str,
    ) -> EntryPoint;
    fn ownable_entry_point_single(
        self,
        arg: Parameter,
        return_type: CLType,
        group_name: &str,
    ) -> EntryPoint;
}

impl ToEntryPoint for &str {
    #[inline]
    fn entry_point(self, args: Parameters, return_type: CLType) -> EntryPoint {
        EntryPoint::new(self, args, return_type, Public, Contract)
    }

    #[inline]
    fn entry_point_no_params(self, return_type: CLType) -> EntryPoint {
        self.entry_point(Vec::new(), return_type)
    }

    #[inline]
    fn entry_point_single(self, arg: Parameter, return_type: CLType) -> EntryPoint {
        self.entry_point(vec![arg], return_type)
    }

    #[inline]
    fn ownable_entry_point(
        self,
        args: Parameters,
        return_type: CLType,
        group_name: &str,
    ) -> EntryPoint {
        EntryPoint::new(
            self,
            args,
            return_type,
            Groups(vec![Group::new(group_name)]),
            Contract,
        )
    }

    #[inline]
    fn ownable_entry_point_single(
        self,
        arg: Parameter,
        return_type: CLType,
        group_name: &str,
    ) -> EntryPoint {
        self.ownable_entry_point(vec![arg], return_type, group_name)
    }
}

#[inline]
pub fn cltype_bytes() -> CLType {
    List(U8.into())
}

#[inline]
pub fn cltype_values() -> CLType {
    List(U256.into())
}

#[cfg(test)]
mod test {
    use casper_types::{
        CLType::{List, U256, U8},
        EntryPoint,
        EntryPointAccess::{Groups, Public},
        EntryPointType::Contract,
        Group, Parameter,
    };

    use crate::contracts::entry_point::{cltype_bytes, cltype_values, ToEntryPoint};

    #[test]
    fn test_entry_point_no_params() {
        let e = "abc_def".entry_point_no_params(cltype_values());

        assert_eq!(
            e,
            EntryPoint::new("abc_def", vec![], List(U256.into()), Public, Contract)
        );
    }

    #[test]
    fn test_entry_point_single() {
        let e = "abc_def".entry_point_single(Parameter::new("param", U8), cltype_bytes());

        assert_eq!(
            e,
            EntryPoint::new(
                "abc_def",
                vec![Parameter::new("param", U8)],
                List(U8.into()),
                Public,
                Contract
            )
        );
    }

    #[test]
    fn test_ownable_entry_point_single() {
        let e = "abc_def".ownable_entry_point_single(
            Parameter::new("param", cltype_bytes()),
            cltype_bytes(),
            "xxx",
        );

        assert_eq!(
            e,
            EntryPoint::new(
                "abc_def",
                vec![Parameter::new("param", cltype_bytes())],
                List(U8.into()),
                Groups(vec![Group::new("xxx")]),
                Contract
            )
        );
    }
}
