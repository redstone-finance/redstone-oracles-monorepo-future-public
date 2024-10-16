import { http, HttpResponse } from "msw";
import { mockSignedDataPackages } from "./mock-packages";

const getMockResponseObject = (url: string) => {
  if (url.includes("sorted-asc-only-eth")) {
    const signedDataPackagesObjects = mockSignedDataPackages.ETH;
    const [dataPackage1, dataPackage2] = signedDataPackagesObjects;
    return {
      ETH: [
        {
          ...dataPackage1,
          timestampMilliseconds: 10,
        },
        {
          ...dataPackage2,
          timestampMilliseconds: 11,
        },
      ],
    };
  } else {
    return mockSignedDataPackages;
  }
};

export const handlers = [
  "https://oracle-gateway-1.a.redstone.finance",
  "https://oracle-gateway-2.a.redstone.finance",
  "https://good-url-1.com",
  "https://good-url-sorted-asc-only-eth.com",
  "https://bad-url-1.com",
  "https://bad-url-2.com",
  "http://valid-cache.com",
].map((url) =>
  http.get(url + "/data-packages/latest/*", ({ request }) => {
    if (new URL(request.url).origin.includes("bad-url")) {
      return new HttpResponse(null, { status: 400 });
    } else {
      const responseObject = getMockResponseObject(url);
      return HttpResponse.json(responseObject);
    }
  })
);
