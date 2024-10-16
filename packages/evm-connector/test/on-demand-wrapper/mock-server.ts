import {
  prepareMessageToSign,
  signOnDemandDataPackage,
  UniversalSigner,
} from "@redstone-finance/protocol";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MOCK_PRIVATE_KEYS } from "../../src/helpers/test-utils";

const VERIFIED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const handlers = [
  http.get("http://first-node.com/score-by-address", ({ request }) => {
    const signedDataPackage = getSignedDataPackage({
      request,
      privateKey: MOCK_PRIVATE_KEYS[1],
      valueBasedOnAddress: true,
    });

    return HttpResponse.json(signedDataPackage.toObj());
  }),

  http.get("http://second-node.com/score-by-address", ({ request }) => {
    const signedDataPackage = getSignedDataPackage({
      request,
      privateKey: MOCK_PRIVATE_KEYS[2],
      valueBasedOnAddress: true,
    });

    return HttpResponse.json(signedDataPackage.toObj());
  }),

  http.get(
    "http://invalid-address-node.com/score-by-address",
    ({ request }) => {
      const signedDataPackage = getSignedDataPackage({
        request,
        value: 1234,
        privateKey: MOCK_PRIVATE_KEYS[2],
        dataFeedId: "invalid data feed id",
      });

      return HttpResponse.json(signedDataPackage.toObj());
    }
  ),

  http.get("http://invalid-value-node.com/score-by-address", ({ request }) => {
    const signedDataPackage = getSignedDataPackage({
      request,
      value: 1234,
      privateKey: MOCK_PRIVATE_KEYS[2],
    });
    return HttpResponse.json(signedDataPackage.toObj());
  }),
];

const getSignedDataPackage = ({
  request,
  privateKey,
  value = 0,
  dataFeedId,
  valueBasedOnAddress = false,
}: {
  request: Request;
  privateKey: string;
  value?: number;
  dataFeedId?: string;
  valueBasedOnAddress?: boolean;
}) => {
  const searchParams = new URL(request.url).searchParams;
  const timestamp = searchParams.get("timestamp") ?? "";
  const signature = searchParams.get("signature") ?? "";
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
    dataFeedId ?? address,
    valueToResponse,
    Number(timestamp),
    privateKey
  );
};

export const server = setupServer(...handlers);
