// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ERC-7412 Off-Chain Data Retrieval Contract
 */
interface IERC7412 {
	/**
	 * @dev Emitted when an oracle is requested to provide data. Upon receipt of this error, a wallet client
	 * should automatically resolve the requested oracle data and call fulfillOracleQuery.
	 * @param oracleContract The address of the oracle contract (which is also the fulfillment contract).
	 * @param oracleQuery The query to be sent to the off-chain interface.
	 */
	error OracleDataRequired(address oracleContract, bytes oracleQuery);

	/**
	 * @dev Emitted when the recently posted oracle data requires a fee to be paid. Upon receipt of this error,
	 * a wallet client should attach the requested feeAmount to the most recently posted oracle data transaction
	 */
	error FeeRequired(uint feeAmount);

	/**
	 * @dev Returns a human-readable identifier of the oracle contract. This should map to a URL and API
	 * key on the client side.
	 * @return The oracle identifier.
	 */
	function oracleId() view external returns (bytes32);

	/**
	 * @dev Upon resolving the oracle query, the client should call this function to post the data to the
	 * blockchain.
	 * @param signedOffchainData The data that was returned from the off-chain interface, signed by the oracle.
	 */
	function fulfillOracleQuery(bytes calldata signedOffchainData) payable external;
}
