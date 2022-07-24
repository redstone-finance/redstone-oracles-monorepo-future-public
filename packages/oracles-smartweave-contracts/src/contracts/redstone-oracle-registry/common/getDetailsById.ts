import { ContractErrorType, GetDetailsByIdInput } from "../types";

declare const ContractError: ContractErrorType;

export const getDetailsById = ({
  identifier,
  state,
  oraclesType,
}: GetDetailsByIdInput) => {
  if (!identifier) {
    throw new ContractError("Missing oracle identifier");
  }

  const oracleDetails = state[oraclesType][identifier];

  if (!oracleDetails) {
    throw new ContractError(
      `Oracle with identifier ${identifier} does not exist`
    );
  }

  const identifierObject =
    oraclesType === "nodes" ? { address: identifier } : { id: identifier };

  return { ...oracleDetails, ...identifierObject };
};
