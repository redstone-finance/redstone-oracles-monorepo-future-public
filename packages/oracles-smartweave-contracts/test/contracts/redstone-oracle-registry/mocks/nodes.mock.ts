export const mockNodes = [...Array(6).keys()].reduce(
  (mockNodes, currentIndex) => ({
    ...mockNodes,
    ...{
      [`testNodeAddress${currentIndex + 1}`]: {
        name: `testName${currentIndex + 1}`,
        logo: "logo",
        description: "testDescription",
        dataFeedId: "testId",
        evmAddress: "testAddress",
        ipAddress: "testIpAddress",
        ecdsaPublicKey: "testECDSAPublicKey",
        arweavePublicKey: "testArweavePubicKey",
        url: "testUrl",
      },
    },
  }),
  {}
);
