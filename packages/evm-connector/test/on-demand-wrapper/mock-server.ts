import { setupServer } from "msw/node";
import { rest, RestRequest } from "msw";
import {
  signOnDemandDataPackage,
  UniversalSigner,
  prepareMessageToSign,
} from "@redstone-finance/protocol";
import { MOCK_PRIVATE_KEYS } from "../../src/helpers/test-utils";

interface ScoreByAddressResponse {
  dataPoints: [
    {
      dataFeedId: string;
      value: number;
    }
  ];
  timestampMilliseconds: number;
  signature: string;
}

const VERIFIED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const handlers = [
  rest.get<ScoreByAddressResponse>(
    "http://first-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[1],
        valueBasedOnAddress: true,
      });

      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),

  rest.get<ScoreByAddressResponse>(
    "http://second-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        privateKey: MOCK_PRIVATE_KEYS[2],
        valueBasedOnAddress: true,
      });

      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),

  rest.get<ScoreByAddressResponse>(
    "http://invalid-address-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        value: 1234,
        privateKey: MOCK_PRIVATE_KEYS[2],
        dataFeedId: "invalid data feed id",
      });

      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),

  rest.get<ScoreByAddressResponse>(
    "http://invalid-value-node.com/score-by-address",
    async (req, res, ctx) => {
      const signedDataPackage = getSignedDataPackage({
        request: req,
        value: 1234,
        privateKey: MOCK_PRIVATE_KEYS[2],
      });
      return res(ctx.json(signedDataPackage.toObj()));
    }
  ),
];

const getSignedDataPackage = ({
  request,
  privateKey,
  value = 0,
  dataFeedId,
  valueBasedOnAddress = false,
}: {
  request: RestRequest;
  privateKey: string;
  value?: number;
  dataFeedId?: string;
  valueBasedOnAddress?: boolean;
}) => {
  const timestamp = request.url.searchParams.get("timestamp") ?? "";
  const signature = request.url.searchParams.get("signature") ?? "";
  const message = prepareMessageToSign(Number(timestamp));
  const address = UniversalSigner.recoverAddressFromEthereumHashMessage(
    message,
    signature
  );
  let valueToResponse = value;
  if (valueBasedOnAddress) {
    valueToResponse = address === VERIFIED_ADDRESS ? 1 : 0;
  }

  return signOnDemandDataPackage(
    !!dataFeedId ? dataFeedId : address,
    valueToResponse,
    Number(timestamp),
    privateKey
  );
};

export const server = setupServer(...handlers);
