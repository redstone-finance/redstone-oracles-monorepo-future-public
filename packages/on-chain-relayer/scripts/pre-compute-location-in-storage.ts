import { utils } from "@redstone-finance/protocol";
import { ethers } from "ethers";
import { solidityKeccak256 } from "ethers/lib/utils";

const dataFeedId = utils.convertStringToBytes32("ETH/USDC");

console.log(
  solidityKeccak256(
    ["bytes32", "bytes32"],
    [
      dataFeedId,
      "0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc",
    ]
  )
);

const abi = ["function getExchangeRate() returns (uint256)"];
const iface = new ethers.utils.Interface(abi);

console.log(iface.encodeFunctionData("getExchangeRate"));
